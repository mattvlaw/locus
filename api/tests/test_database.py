import pytest
from api.models import Base, ZoteroVersion, Content
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import os
from api import database

# Set up an in-memory test SQLite database
# test_engine = create_engine('sqlite:///:memory:')
# Base.metadata.create_all(test_engine)
# Session = sessionmaker(bind=test_engine)
# database.Session = Session

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
            "title": "Test Title",
            "content_type": "paper",
            "pdf_filename": "test_paper.pdf",
            "notes_filename": "test_notes.txt",
            "tags": "test, tag",
            "summary": "Test summary",
            "custom_page": False,
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


def test_store_and_get_latest_version():
    database.store_latest_version(100)
    latest_version = database.get_latest_version()
    assert latest_version.version == 100

    database.store_latest_version(200)
    latest_version = database.get_latest_version()
    assert latest_version.version == 200


def test_store_and_get_content_list(sample_content):
    database.store_content(sample_content)
    content_data = database.get_content_list()

    assert len(content_data) == 2
    assert content_data[0]["title"] == "Test Title"
    assert content_data[1]["title"] == "Test Title 2"


def test_update_content(sample_content):
    database.store_content(sample_content)
    content_data = database.get_content_list()

    content_data[0]["title"] = "Updated Test Title"
    database.update_content(content_data)

    updated_content_data = database.get_content_list()
    assert len(updated_content_data) == 2
    assert updated_content_data[0]["title"] == "Updated Test Title"


def test_soft_delete_content(sample_content):
    database.store_content(sample_content)
    content_data = database.get_content_list()

    database.soft_delete_content([content_data[0]])

    with database.Session() as session:
        soft_deleted_content = session.query(Content).filter(Content.deleted == True).all()
        non_deleted_content = session.query(Content).filter(Content.deleted == False).all()

    assert len(soft_deleted_content) == 1
    assert soft_deleted_content[0].title == "Test Title"
    assert len(non_deleted_content) == 1
    assert non_deleted_content[0].title == "Test Title 2"

def test_merge_content(sample_content):
    # Store the sample content
    database.store_content(sample_content)

    # Create a modified version of the first content item and a new content item
    modified_content = sample_content[0].copy()
    modified_content["title"] = "Modified Test Title"

    new_content = {
        "zotero_key": "abc123",
        "title": "New Test Title",
        "content_type": "note",
        "pdf_filename": None,
        "notes_filename": None,
        "tags": "",
        "summary": None,
        "custom_page": None,
    }

    # Merge the modified and new content
    database.merge_content([modified_content, new_content], filter_by_key="zotero_key")

    # Verify that the content list now contains three items
    with database.Session() as session:
        with session.no_autoflush:
            content_data = session.query(Content).all()
    assert len(content_data) == 3
    # Verify that the first content item was updated and the new content item was added
    modified_item = next(item for item in content_data if item.zotero_key == sample_content[0]["zotero_key"])
    assert modified_item.title == "Modified Test Title"

    new_item = next(item for item in content_data if item.zotero_key == "abc123")
    assert new_item.title == "New Test Title"


def test_delete_content(sample_content):
    # Store the sample content
    database.store_content(sample_content)

    # Delete the first content item
    database.delete_content([sample_content[0]])

    # Verify that the content list now contains only one item
    content_data = database.get_content_list()
    assert len(content_data) == 1

    # Verify that the remaining item is the second content item
    assert content_data[0]['zotero_key'] == sample_content[1]["zotero_key"]


def test_sync_content(sample_content):
    # Store the sample content
    database.store_content(sample_content)

    # Create a list of new and modified content items
    new_and_modified_items = [
        {
            "zotero_key": "abc123",
            "title": "New Test Title",
            "content_type": "note",
            "pdf_filename": None,
            "notes_filename": None,
            "tags": "",
            "summary": None,
            "custom_page": None,
        },
        {
            "zotero_key": sample_content[0]["zotero_key"],
            "title": "Modified Test Title",
            "content_type": sample_content[0]["content_type"],
            "pdf_filename": sample_content[0]["pdf_filename"],
            "notes_filename": sample_content[0]["notes_filename"],
            "tags": sample_content[0]["tags"],
            "summary": sample_content[0]["summary"],
            "custom_page": sample_content[0]["custom_page"],
        },
    ]

    # Create a list of deleted content items
    deleted_items = [sample_content[1]]

    # Sync content with the new and modified items and the deleted items
    database.sync_content(new_and_modified_items, deleted_items)

    # Verify that the content list now contains two items
    with database.Session() as session:
        with session.no_autoflush:
            content_data = session.query(Content).filter(Content.deleted == False).all()
    assert len(content_data) == 2

    # Verify that the first content item was updated and the new content item was added
    modified_item = next(item for item in content_data if item.zotero_key == sample_content[0]["zotero_key"])
    assert modified_item.title == "Modified Test Title"

    new_item = next(item for item in content_data if item.zotero_key == "abc123")
    assert new_item.title == "New Test Title"

    # Verify that the second content item was soft deleted
    with database.Session() as session:
        soft_deleted_content = session.query(Content).filter(Content.deleted == True).all()
        non_deleted_content = session.query(Content).filter(Content.deleted == False).all()

    assert len(soft_deleted_content) == 1
    assert soft_deleted_content[0].zotero_key == sample_content[1]["zotero_key"]
    assert len(non_deleted_content) == 2

