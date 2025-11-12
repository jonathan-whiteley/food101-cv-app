import base64
from databricks.sdk import WorkspaceClient
from typing import Dict, Any
import asyncio
from functools import partial


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

        # Prepare payload
        payload = {
            'dataframe_split': {
                'columns': ['image_bytes'],
                'data': [[image_b64]]
            }
        }

        # Get workspace client
        w = self._get_client()

        # Use SDK's serving endpoint query method (runs in thread pool since it's sync)
        # This handles authentication automatically using the app's service principal
        loop = asyncio.get_event_loop()
        query_func = partial(
            w.serving_endpoints.query,
            name="food101-cv-conformal-endpoint",
            dataframe_split=payload['dataframe_split']
        )

        # Run the synchronous SDK call in a thread pool
        response = await loop.run_in_executor(None, query_func)

        # Debug: log response type and structure
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Response type: {type(response)}")
        logger.info(f"Response: {response}")

        # Parse response - SDK returns a dict
        if isinstance(response, dict):
            predictions = response.get('predictions', [])
        elif hasattr(response, 'predictions'):
            # It's an object, get predictions attribute
            predictions = getattr(response, 'predictions', [])
        else:
            raise ValueError(f"Unexpected response type: {type(response)}, response: {response}")

        if not predictions:
            raise ValueError("No predictions returned from model")

        # Extract first prediction
        prediction = predictions[0]

        return {
            'top_prediction': prediction['top_prediction'],
            'top_score': prediction['top_score'],
            'prediction_set': prediction['prediction_set'],
            'prediction_scores': prediction['prediction_scores'],
            'set_size': prediction['set_size']
        }
