from fastapi import APIRouter, HTTPException
from app.services.implementations.embedding_generator import EmbeddingGenerator
from app.core.config import settings
import aiohttp
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/health")
async def health_check():
    return {"status": "healthy"}


@router.get("/health/ml")
async def ml_health_check():
    """Check if ML dependencies and embedding generator are working correctly."""
    try:
        # Test embedding generator
        generator = EmbeddingGenerator()
        test_text = "This is a test sentence for health check"
        
        logger.info("Testing embedding generator...")
        embedding = await generator.generate_embedding(test_text)
        
        if not embedding or len(embedding) == 0:
            raise ValueError("Embedding generation returned empty result")
        
        return {
            "status": "healthy",
            "ml_status": "operational",
            "embedding_dimension": len(embedding),
            "model_name": generator.model_name
        }
    except ImportError as e:
        logger.error(f"ML dependencies not installed: {e}")
        raise HTTPException(
            status_code=503, 
            detail=f"ML dependencies not available: {str(e)}"
        )
    except Exception as e:
        logger.error(f"ML health check failed: {e}")
        raise HTTPException(
            status_code=503, 
            detail=f"ML health check failed: {str(e)}"
        )


@router.get("/health/search")
async def search_health_check():
    """Check if Google Search API is working correctly."""
    try:
        # Test Google Search API
        search_endpoint = "https://customsearch.googleapis.com/customsearch/v1"
        api_key = settings.GOOGLE_SEARCH_API_KEY
        search_engine_id = settings.GOOGLE_SEARCH_ENGINE_ID
        
        if not api_key or not search_engine_id:
            raise ValueError("Google Search API credentials not configured")
        
        params = {
            "key": api_key,
            "cx": search_engine_id,
            "q": "test search",
            "num": 1,
            "fields": "items(title,link,snippet)",
        }
        
        logger.info(f"Testing Google Search API...")
        logger.info(f"API Key length: {len(api_key) if api_key else 0}")
        logger.info(f"Engine ID: {search_engine_id}")
        
        async with aiohttp.ClientSession() as session:
            async with session.get(search_endpoint, params=params) as response:
                logger.info(f"Search API Response Status: {response.status}")
                
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"Search API error: {error_text}")
                    raise HTTPException(
                        status_code=503,
                        detail=f"Search API error ({response.status}): {error_text}"
                    )
                
                data = await response.json()
                num_results = len(data.get('items', []))
                
                return {
                    "status": "healthy",
                    "search_status": "operational",
                    "api_key_configured": bool(api_key),
                    "engine_id_configured": bool(search_engine_id),
                    "api_key_length": len(api_key) if api_key else 0,
                    "engine_id": search_engine_id,
                    "test_results": num_results
                }
                
    except Exception as e:
        logger.error(f"Search health check failed: {e}")
        raise HTTPException(
            status_code=503, 
            detail=f"Search health check failed: {str(e)}"
        )
