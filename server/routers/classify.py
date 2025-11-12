from fastapi import APIRouter, UploadFile, HTTPException
from server.services.model_client import ModelServingClient
from databricks.sdk.errors import DatabricksError
import asyncio

router = APIRouter()
model_client = ModelServingClient()


@router.post("/api/classify")
async def classify_image(image: UploadFile):
    """
    Classify uploaded food image.

    Args:
        image: Uploaded image file (JPG/PNG)

    Returns:
        Classification results with prediction set
    """
    # Validate content type
    allowed_types = ["image/jpeg", "image/png"]
    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only JPG and PNG are supported."
        )

    # Read file bytes
    image_bytes = await image.read()

    # Validate file size (10MB max)
    max_size = 10 * 1024 * 1024
    if len(image_bytes) > max_size:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 10MB."
        )

    try:
        # Call model serving endpoint
        result = await model_client.classify_image(image_bytes)
        return result

    except DatabricksError as e:
        # Handle Databricks SDK errors (including auth errors)
        raise HTTPException(
            status_code=502,
            detail=f"Model serving endpoint error: {str(e)}"
        )
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=504,
            detail="Model serving endpoint timeout. Endpoint may be starting up."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Classification error: {str(e)}"
        )
