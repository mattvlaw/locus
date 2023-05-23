import os
import pytest
from pyzotero import zotero
from dotenv import load_dotenv
from typing import Dict

os.environ["TESTING"] = "1"

load_dotenv()

from api.zotero_sync import (
    get_changed_items_since,
    get_all_items,
    get_collection_id_by_name,
    sync_zotero_down,
    create_item_in_collection,
)
from typing import Dict

ZOTERO_API_KEY = os.getenv("ZOTERO_API_KEY")
ZOTERO_USER_ID = os.getenv("ZOTERO_USER_ID")
ZOTERO_COLLECTION_NAME = "locus_test"

# Helper function to delete an item from Zotero
def delete_item(api_key: str, user_id: str, item_data: Dict, last_modified: int = None) -> bool:
    zot = zotero.Zotero(user_id, 'user', api_key)
    response = zot.delete_item(item_data, last_modified=last_modified)
    return response # because of the backoff decorator, this will always be True if the item was deleted successfully (204 status). Otherwise, it will raise an exception.
# Test data
test_item_data = {
    "itemType": "journalArticle",
    "title": "Test Article",
    "creators": [
        {
            "creatorType": "author",
            "firstName": "John",
            "lastName": "Doe"
        }
    ],
    "publicationTitle": "Test Journal",
    "volume": "1",
    "issue": "1",
    "pages": "1-10",
    "date": "2023"
}

def test_create_item_in_collection():
    item_data = create_item_in_collection(ZOTERO_API_KEY, ZOTERO_USER_ID, ZOTERO_COLLECTION_NAME, test_item_data)
    assert item_data is not None
    delete_item(ZOTERO_API_KEY, ZOTERO_USER_ID, item_data)

def test_get_changed_items_since():
    # Add an item to the locus_test collection
    item_data = create_item_in_collection(ZOTERO_API_KEY, ZOTERO_USER_ID, ZOTERO_COLLECTION_NAME, test_item_data)
    assert item_data is not None

    # Test the get_changed_items_since function with the newly added item
    latest_version, changed_items, deleted_items = get_changed_items_since(
        ZOTERO_API_KEY, ZOTERO_USER_ID, ZOTERO_COLLECTION_NAME, 0, get_deleted=True
    )
    assert latest_version > 0
    assert len(changed_items) > 0

    # Clean up: delete the added item
    delete_item(ZOTERO_API_KEY, ZOTERO_USER_ID, item_data)

def test_get_all_items():
    # Add an item to the locus_test collection
    item_data = create_item_in_collection(ZOTERO_API_KEY, ZOTERO_USER_ID, ZOTERO_COLLECTION_NAME, test_item_data)
    assert item_data is not None

    # Test the get_all_items function with the newly added item
    latest_version, items = get_all_items(ZOTERO_API_KEY, ZOTERO_USER_ID, ZOTERO_COLLECTION_NAME)
    assert latest_version > 0
    assert len(items) > 0

    # Clean up: delete the added item
    delete_item(ZOTERO_API_KEY, ZOTERO_USER_ID, item_data, last_modified=latest_version)

def test_get_collection_id_by_name():
    zot = zotero.Zotero(ZOTERO_USER_ID, 'user', ZOTERO_API_KEY)
    collection_id = get_collection_id_by_name(zot, ZOTERO_COLLECTION_NAME)
    assert collection_id is not None

# Additional tests for sync_zotero_down and sync_zotero_up_down can be added here.
# These tests may require mocking the database functions to avoid modifying the actual database.
