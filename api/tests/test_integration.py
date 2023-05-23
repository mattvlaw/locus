from api.zotero_sync import sync_zotero_down
import json
import pytest
from pyzotero import zotero
from pytest_mock import mocker
from api.models import Base, ZoteroVersion, Content
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import os
from api import database


@pytest.fixture
def mock_zotero_api(mocker):
    # Mock Zotero API calls
    mocker.patch("api.zotero_sync.zotero.Zotero", autospec=True)

    # Configure the mock API response for get_collection_id_by_name
    zotero.Zotero.return_value.collections.return_value = [{"data": {"key": "COLLECTION_KEY", "name": "ZOTERO_COLLECTION_NAME"}}]

    # Configure the mock API response for items() and deleted()
    zotero.Zotero.return_value.collection_items.return_value = json.loads("""
    [
        {
            "key": "ABCD1234",
            "version": 2,
            "data": {
                "title": "Modified Test Title"
            }
        },
        {
            "key": "EFGH5678",
            "version": 2,
            "data": {
                "title": "Test Title 2"
            }
        }
    ]
    """)

    zotero.Zotero.return_value.deleted.return_value = {
        "items": ["ABCD1234"]
    }
    class MockResponse:
        def __init__(self, headers):
            self.headers = headers
    # Configure the mock API response for request.headers
    zotero.Zotero.return_value.request = MockResponse({"Last-Modified-Version": "2"})

    return zotero.Zotero

@pytest.fixture(scope="function", autouse=True)
def db_session():
    os.environ["TESTING"] = "1"
    Base.metadata.create_all(database.engine)
    yield
    Base.metadata.drop_all(database.engine)
    del os.environ["TESTING"]



@pytest.fixture
def sample_content():
    content_list = [
        {
            "zotero_key": "ABCD1234",
            "zotero_version": 1,
            "metadata":{'key': 'MJXNWXQP', 'version': 1275, 'itemType': 'journalArticle', 'title': 'Test Article', 'creators': [{'creatorType': 'author', 'firstName': 'John', 'lastName': 'Doe'}], 'abstractNote': '', 'publicationTitle': 'Test Journal', 'volume': '1', 'issue': '1', 'pages': '1-10', 'date': '2023', 'series': '', 'seriesTitle': '', 'seriesText': '', 'journalAbbreviation': '', 'language': '', 'DOI': '', 'ISSN': '', 'shortTitle': '', 'url': '', 'accessDate': '', 'archive': '', 'archiveLocation': '', 'libraryCatalog': '', 'callNumber': '', 'rights': '', 'extra': '', 'tags': [], 'collections': ['3F7I62HR'], 'relations': {}, 'dateAdded': '2023-04-02T08:34:50Z', 'dateModified': '2023-04-02T08:34:50Z'},
            "title": "Test Title",
            "content_type": "paper",
            "tags": "test, tag",
            "summary": "Test summary",
            "deleted": False,
        },
        {
            "zotero_key": "EFGH5678",
            "title": "Test Title 2",
            "content_type": "paper",
            "pdf_filename": "test_paper_2.pdf",
            "notes_filename": "test_notes_2.txt",
            "tags": "test, tag2",
            "summary": "Test summary 2",
            "custom_page": False,
        }
    ]
    return content_list
def test_sync_zotero_down(db_session, sample_content, mock_zotero_api):
    # Store the initial content
    database.store_content(sample_content)
    database.store_latest_version(1)

    # Sync down
    sync_zotero_down("API_KEY", "USER_ID", "ZOTERO_COLLECTION_NAME")

    # Check the latest version
    latest_version = database.get_latest_version()
    assert latest_version.version == 2

    # Check the content in the database
    content_data = database.get_content_list()
    assert len(content_data) == 2
    assert content_data[0]["title"] == "Modified Test Title"
    assert content_data[1]["title"] == "Test Title 2"

    # Check if the first item was soft deleted
    with database.Session() as session:
        soft_deleted_content = session.query(Content).filter(Content.deleted == True).all()
        non_deleted_content = session.query(Content).filter(Content.deleted == False).all()

    assert len(soft_deleted_content) == 1
    assert soft_deleted_content[0].title == "Test Title"
    assert len(non_deleted_content) == 2
