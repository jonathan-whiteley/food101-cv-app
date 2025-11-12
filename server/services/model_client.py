import base64
from databricks.sdk import WorkspaceClient
from databricks.sdk.service.serving import DataframeSplitInput
from typing import Dict, Any
import asyncio
from functools import partial
import logging

logger = logging.getLogger(__name__)


class ModelServingClient:
    def __init__(self):
        self._w = None

    def _get_client(self):
        """Lazy-load WorkspaceClient to avoid initialization during imports."""
        if self._w is None:
            self._w = WorkspaceClient()
        return self._w

    async def classify_image(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Classify food image using model serving endpoint.

        Args:
            image_bytes: Raw image bytes (JPG/PNG)

        Returns:
            Dictionary with prediction results
        """
        # Base64 encode image
        image_b64 = base64.b64encode(image_bytes).decode('utf-8')

        # Get workspace client
        w = self._get_client()

        # Prepare input using SDK's DataframeSplitInput class
        dataframe_input = DataframeSplitInput(
            columns=['image_bytes'],
            data=[[image_b64]]
        )

        # Use SDK's serving endpoint query method (runs in thread pool since it's sync)
        # This handles authentication automatically using the app's service principal
        loop = asyncio.get_event_loop()
        query_func = partial(
            w.serving_endpoints.query,
            name="food101-cv-conformal-endpoint",
            dataframe_split=dataframe_input
        )

        # Run the synchronous SDK call in a thread pool
        response = await loop.run_in_executor(None, query_func)

        logger.info(f"Response type: {type(response)}")
        logger.info(f"Response dir: {dir(response)}")

        # Parse response - SDK returns QueryEndpointResponse object
        # Access the predictions attribute directly
        try:
            # The response object has a predictions attribute
            predictions_data = response.predictions
            logger.info(f"Predictions data type: {type(predictions_data)}")
            logger.info(f"Predictions data: {predictions_data}")

            # predictions_data is a list of dicts
            if not predictions_data:
                raise ValueError("No predictions returned from model")

            prediction = predictions_data[0]

        except AttributeError as e:
            logger.error(f"AttributeError accessing predictions: {e}")
            logger.error(f"Response object: {response}")
            raise ValueError(f"Failed to parse model response: {e}")

        return {
            'top_prediction': prediction['top_prediction'],
            'top_score': prediction['top_score'],
            'prediction_set': prediction['prediction_set'],
            'prediction_scores': prediction['prediction_scores'],
            'set_size': prediction['set_size']
        }
