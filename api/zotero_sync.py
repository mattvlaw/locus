import os
from typing import List, Dict, Optional, Tuple, Union
from pyzotero import zotero
if __name__ == "__main__":
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from api.database import store_latest_version, get_latest_version, sync_content, store_content_list, create_group_with_zotero_keys
from api.models import Content, Author
from api.converters import zotero2Content, zotero2Dict
from dotenv import load_dotenv
load_dotenv()

CONTENT_FILE_PATH = os.getenv("CONTENT_FILE_PATH")
import requests

"""
zotero_sync.py

This module provides functions to sync a Zotero library with a local database. It includes functions to fetch
changed items (new, modified, and deleted) from a specified Zotero collection since the last sync, as well as
functions to fetch all items from the collection. It also includes helper functions to get a collection ID by its
name and to sync the local database with Zotero based on the fetched items. The main purpose of this module is to
facilitate easy synchronization of the Zotero library with the Locus app.

Functions:
- get_changed_items_since(api_key, user_id, collection_name, latest_version, get_deleted=False): Fetches items
  that have been added or modified in a specified Zotero collection since the last sync, as well as deleted items
  if specified.
- get_all_items(api_key, user_id, collection_name): Fetches all items from a specified Zotero collection.
- get_collection_id_by_name(zot, collection_name): Retrieves the collection ID of a specified Zotero collection
  by its name.
- sync_zotero_down(api_key, user_id, collection_name): Syncs the local database with the Zotero library, updating
  the local database with new, modified, and deleted items.
- sync_zotero_up_down(api_key, user_id, collection_name): Syncs the local database with the Zotero library in
  both directions (download new items from Zotero, upload new items to Zotero).
"""


def get_changed_items_since(api_key: str, user_id: str, collection_name: str, latest_version: int, get_deleted: bool = False) -> Tuple[int, List[dict], Optional[List[dict]]]:
    """
    Get items that have been added, modified, or deleted since the given version.
    
    :param api_key: Zotero API key
    :param user_id: Zotero user ID
    :param collection_name: Name of the Zotero collection to fetch items from
    :param latest_version: Latest known version of the collection
    :param get_deleted: If True, also returns a list of deleted items; otherwise, returns None
    :return: Tuple containing the latest version of the collection, a list of changed items, and (if get_deleted=True) a list of deleted items
    """
    zot = zotero.Zotero(user_id, 'user', api_key)
    collection_id = get_collection_id_by_name(zot, collection_name)
    
    # Get items that have changed since the latest version
    changed_items = zot.everything(zot.collection_items(collection_id, since=latest_version, itemType="-attachment"))
    latest_version = int(zot.request.headers["Last-Modified-Version"])
    
    if get_deleted:
        deleted_items = zot.deleted(since=latest_version, collection=collection_id)
        return latest_version, changed_items, deleted_items["items"]
    else:
        return latest_version, changed_items, None
    # zot = zotero.Zotero(user_id, 'user', api_key)
    # collection_id = get_collection_id_by_name(zot, collection_name)
    
    # # Get items that have changed since the latest version
    # changed_items = zot.get_items_since(latest_version, collection=collection_id)
    # latest_version = zot.request.headers["Last-Modified-Version"]
    # if get_deleted:
    #     deleted_items = zot.get_deleted(latest_version.version)
    #     return latest_version, changed_items, deleted_items
    # else:
    #     return latest_version, changed_items, None

def get_all_items(api_key: str, user_id: str, collection_name: str) -> Tuple[int, List[dict]]:
    """
    Get all items in the specified Zotero collection.
    
    :param api_key: Zotero API key
    :param user_id: Zotero user ID
    :param collection_name: Name of the Zotero collection to fetch items from
    :return: Tuple containing the latest version of the collection and a list of all items in the collection
    """
    zot = zotero.Zotero(user_id, 'user', api_key)
    collection_id = get_collection_id_by_name(zot, collection_name)

    # Get all items in the collection
    items = zot.everything(zot.collection_items(collection_id, itemType="-attachment"))
    latest_version = int(zot.request.headers["Last-Modified-Version"])
    return latest_version, items

def get_collection_id_by_name(zot: zotero.Zotero, collection_name: str) -> Union[str, None]:
    """
    Get the ID of a Zotero collection with the specified name.
    
    :param zot: Zotero API instance
    :param collection_name: Name of the Zotero collection to find
    :return: Collection ID if found, None otherwise
    """
    collections = zot.collections()
    for collection in collections:
        if collection['data']['name'] == collection_name:
            return collection['data']['key']
    return None

def create_item_in_collection(api_key: str, user_id: str, collection_name: str, item_data: Dict) -> str:
    """
    Add an item to a Zotero collection.

    :param api_key: Zotero API key
    :param user_id: Zotero user ID
    :param collection_name: Name of the Zotero collection to add the item to
    :param item_data: Dictionary containing the item data
    :return: Item ID if the item was added successfully, None otherwise
    """
    zot = zotero.Zotero(user_id, 'user', api_key)
    collection_id = get_collection_id_by_name(zot, collection_name)
    if not collection_id:
        return None
    # Create a new item with the given item_data
    item_data["collections"] = [collection_id]
    response = zot.create_items([item_data])
    if response:
        item_data = response['successful']['0'] #item_id is item_data["key"]
        return item_data

    return None


def download_zotero_attachment(api_key: str, user_id: str, item_key: str, download_dir: str) -> str:
    """
    Download the attachment for a Zotero item if it exists.

    :param api_key: Zotero API key
    :param user_id: Zotero user ID
    :param item_key: The key of the Zotero item.
    :param download_dir: The directory where the attachment should be downloaded.
    :return: The downloaded attachment item or None if no attachment found.
    """
    # Retrieve the child items (attachments) of the Zotero item
    zot = zotero.Zotero(user_id, 'user', api_key)
    attachments = zot.children(item_key)

    # Iterate through attachments to find the PDF
    for attachment in attachments:
        if attachment.get('data', {}).get('contentType') == 'application/pdf':
            # # If a PDF attachment is found, download it
            # # attachment_url = zot.file [1]['links']['enclosure']['href']
            # attachment_url = attachment['links']['enclosure']['href']
            # response = requests.get(attachment_url, headers={"Authorization": f"Bearer {api_key}"}, stream=True)
            
            # # Save the PDF to the specified directory
            # filename = os.path.join(download_dir, attachment['data']['filename'])
            # with open(filename, 'wb') as f:
            #     for chunk in response.iter_content(chunk_size=8192):
            #         if chunk:  # Filter out keep-alive chunks
            #             f.write(chunk)
            # If a PDF attachment is found, download it
            attachment_key = attachment['data']['key']
            file_content = zot.file(attachment_key)

            # Save the PDF to the specified directory
            filename = os.path.join(download_dir, attachment['data']['filename'])
            with open(filename, 'wb') as f:
                f.write(file_content)

            return attachment

    return None

def store_attachment_for_item(api_key: str, user_id: str, item_key: str) -> bool:
    """
    Try to download and store an attachment to a Zotero item in the db

    :param api_key: Zotero API key
    :param user_id: Zotero user ID
    :param item_key: The key of the Zotero item.
    :return: True if the attachment was added successfully, False otherwise.
    """
    attachment = download_zotero_attachment(api_key, user_id, item_key, CONTENT_FILE_PATH)
    if attachment:
        # Add the attachment to the db
        store_content_list([zotero2Dict(attachment)])
        # create a group with the item key and the attachment key
        new_group = create_group_with_zotero_keys(attachment["data"]["parentItem"],attachment["key"])
        
        return True
    return False

# def download_attachment(item: dict) -> dict:
#     # request the metada for the attachment item from zotero
#     url = item['links']['attachment']['href']
    
#     if "enclosure" not in item['links'] or item["data"]['linkMode'] == "linked_file":
#         # the attachment file is not available in the API
#         item["data"]["filename"] = None
#         return item
#     print(item)
#     links = item['links']
#     url = links['enclosure']['href']
#     if "title" not in links['enclosure']:
#         if links["enclosure"]["type"] == "text/html":
#             fname = os.path.join(CONTENT_FILE_PATH, f"{item['key']}.html")
#     else:
#         fname = os.path.join(CONTENT_FILE_PATH,links['enclosure']['title'])
#     try:
#         r = requests.get(url, allow_redirects=True)
#         with open(fname, 'wb') as f:
#             f.write(r.content)
#         item["data"]["filename"] = fname
#     except Exception as e:
#         print(f"Error downloading attachment: {e}")
#         item["data"]["filename"] = item['links']['enclosure']['href']
#     return item


def sync_zotero_down(api_key: str, user_id: str, collection_name: str) -> None:
    """
    Download new and updated items from Zotero and store them in the local database.
    
    :param api_key: Zotero API key
    :param user_id: Zotero user ID
    :param collection_name: Name of the Zotero collection to sync
    """
    latest_version = get_latest_version()
    if latest_version:
        remote_version, new_and_modified, deleted = get_changed_items_since(api_key, user_id, collection_name, latest_version.version, get_deleted=True)
        print(f"New and modified items: {new_and_modified}")
        print(f"Deleted items: {deleted}")
        sync_content([zotero2Dict(n) for n in new_and_modified], [zotero2Dict(d) for d in deleted])
    else:
        remote_version, content_list = get_all_items(api_key, user_id, collection_name)
        # print(content_list)
        # store_content_list([c['data'] for c in content_list])
        store_content_list([zotero2Dict(c)  for c in content_list if c['data']['itemType'] not in ['note', 'attachment']])
    store_latest_version(remote_version)
    return remote_version

def sync_zotero_up_down(api_key: str, user_id: str, collection_name: str) -> None:
    """
    Sync both ways; download new items from Zotero, upload new items to Zotero.
    
    :param api_key: Zotero API key
    :param user_id: Zotero user ID
    :param collection_name: Name of the Zotero collection to sync
    """
    pass
    

if __name__ == "__main__":
    load_dotenv()
    ZOTERO_API_KEY = os.getenv("ZOTERO_API_KEY")
    ZOTERO_USER_ID = os.getenv("ZOTERO_USER_ID")
    ZOTERO_COLLECTION_NAME = "locus_test"
    item_data = {
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
    create_item_in_collection(ZOTERO_API_KEY, ZOTERO_USER_ID, ZOTERO_COLLECTION_NAME, item_data)

    items = get_all_items(ZOTERO_API_KEY, ZOTERO_USER_ID, ZOTERO_COLLECTION_NAME)
    import pdb; pdb.set_trace()

    print(items)

