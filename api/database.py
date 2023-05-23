from typing import List, Dict, Tuple, Union, Optional
from api.models import ZoteroVersion, Content, Author, Group, GroupType, User
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from datetime import datetime
from sqlalchemy.orm import Session

import os

"""
This module contains convenience functions for interacting with the database. The functions are mainly used for
storing, updating, and retrieving content synced from Zotero. They make use of the models defined in the `models.py`
file and work with a SQLite database named `locus.db`.

The functions in this module work with a `Session` object from SQLAlchemy to interact with the database. There are
functions for handling the following operations:

1. Storing and retrieving the latest Zotero version number, which is used for syncing.
2. Storing, updating, and retrieving content items (papers, notes, etc.).
3. Soft deleting and restoring content items.
4. Syncing content with Zotero.

The module also contains a helper function to create an SQLAlchemy engine and session factory.
"""


# Initialize the database engine and create a session factory
def create_db_engine():
    if os.environ.get("TESTING"):
        return create_engine("sqlite:///:memory:")
    else:
        return create_engine("sqlite:///locus.db")

engine = create_db_engine()
Session = sessionmaker(bind=engine)


# Zotero version functions. We store the version number to check what has changed since we last synced.
def store_latest_version(version: int) -> None:
    """
    Store the latest Zotero version number in the database.

    Args:
        version (int): The latest Zotero version number.
    """
    with Session() as session:
        new_version = ZoteroVersion(version=version, timestamp=datetime.utcnow())
        session.add(new_version)
        session.commit()

def get_latest_version() -> ZoteroVersion:
    """
    Retrieve the latest Zotero version number stored in the database.

    Returns:
        ZoteroVersion: The latest stored Zotero version number.
    """
    with Session() as session:
        session = Session()
        latest_version = session.query(ZoteroVersion).order_by(ZoteroVersion.timestamp.desc()).first()
    return latest_version


def store_user(user_data: Dict[str,str]) -> None:
    """
    Add a new user to the database.
    """
    with Session() as session:
        username = user_data['username']
        password = user_data['password']
        first_name = user_data['first_name']
        last_name = user_data['last_name']
        existing_user = session.query(User).filter_by(username=username).first()
        if existing_user:
            return existing_user, "User already exists."
        new_author =  Author(first_name=first_name, last_name=last_name)
        new_user = User(username=username, author=new_author)
        new_user.set_password(password)
        session.add(new_user)
        session.commit()
        return new_user, False
    
def get_user(user: dict, session:Optional[Session]=None) -> User:
    """
    Retrieve a user from the database.
    """
    close_session = False
    if session is None:
        session = Session()
        close_session = True
    founduser = None
    if 'id' in user:
        user_id = user['id']
        founduser = session.query(User).filter_by(id=user_id).first()
    elif 'username' in user:
        username = user['username']
        founduser = session.query(User).filter_by(username=username).first()
        
    if close_session:
        session.close()
    return founduser
def store_author(author_data: Dict[str, str]) -> None:
    """
    Add a new author to the database.

    Args:
        author_data (Dict[str, str]): A dictionary containing the data for the Author instance.
    """
    with Session() as session:
        new_author = Author(**author_data)
        session.add(new_author)
        session.commit()

# Content database functions.
def get_content_list(asdict: Optional[bool] = False) -> List[Dict[str, str]]:
    """
    Retrieve a list of content from the database.

    Returns:
        List[Dict[str, str]]: A list of dictionaries containing content data.
    """
    with Session() as session:
        content_list = session.query(Content).filter(Content.deleted == False).all()
        if asdict:
            return [c.to_dict() for c in content_list]
        else:
            return content_list

def update_content(content_list: List[Dict[str, str]]) -> None:
    """
    Update the specified content in the database.

    Args:
        content_list (List[Dict[str, str]]): A list of dictionaries containing content data.
    """
    print(f"Updating content list: {content_list}")
    with Session() as session:
        for content in content_list:
            print(f"Updating content: {content}")
            rows_matched = session.query(Content).filter(Content.id == content['id']).count()
            print(f"Rows matched: {rows_matched}")
            rows_updated = session.query(Content).filter(Content.id == content['id']).update(content, synchronize_session='fetch')
            print(f"Rows updated: {rows_updated}")
        session.commit()

def create_highlight(content, highlight_text, return_dict=False):
    with Session() as session:
        # content_obj = {
        #     'highlight_text': highlight_text,
        #     'position': content.get('position', None)
        # }
        highlight_entry = Content(
            content_type='highlight',
            title=content.get('title', ''),
            content_metadata=content.get('content_metadata', {}),
            summary=content.get('comment', ''),
        )
        session.add(highlight_entry)
        session.commit()
        if return_dict:
            return highlight_entry.to_dict()
        else:
            return highlight_entry
# Example usage
# highlight = create_highlight({'title': 'Highlight 1'}, 'Original highlighted text')
# chat = create_chat({'title': 'Chat 1'}, [{'role': 'user', 'content': 'Message text'}], [{'id': 1, 'text': 'Highlight text'}])
# retrieved_chat = get_chat_by_id(chat.id)
# print(retrieved_chat)

def get_highlights(asdict: Optional[bool] = False) -> List[Dict[str, str]]:
    """
    Retrieve a list of highlights from the database.

    Returns:
        List[Dict[str, str]]: A list of dictionaries containing highlight data.
    """
    with Session() as session:
        highlights = session.query(Content).filter(Content.content_type == 'highlight').all()
        if asdict:
            return [h.to_dict() for h in highlights]
        else:
            return highlights

def get_chats(asdict: Optional[bool] = False) -> List[Dict[str, str]]:
    """
    Retrieve a list of chats from the database.

    Returns:
        List[Dict[str, str]]: A list of dictionaries containing chat data.
    """
    with Session() as session:
        chats = session.query(Content).filter(Content.content_type == 'chat').all()
        if asdict:
            return [c.to_dict() for c in chats]
        else:
            return chats

def create_chat(content, messages, highlights, return_dict=False):
    # Each highlight object includes a reference to the independent highlight entry (highlight_entry_id)
    # along with the original text (text) of the highlight
    chat_entry = Content(
        content_type='chat',
        title=content.get('title', ''),
        content_metadata={
            'chat': {
                'messages': messages,
                'highlights': [
                    {
                        'id': highlight.get('id'),  # Unique identifier within the chat
                        'text': highlight.get('text'),  # Original text of the highlight
                        'highlight_entry_id': highlight.get('highlight_entry_id')  # Reference to the independent highlight entry
                    }
                    for highlight in highlights
                ]
            }
        }
    )
    # highlights = [
    #     {
    #         'id': 1,
    #         'text': 'Original highlighted text',
    #         'highlight_entry_id': 5  # ID of the independent highlight entry in the Content table
    #     }
    # ]
    # chat = create_chat({'title': 'Chat 1'}, [{'role': 'user', 'content': 'Message text'}], highlights)

    with Session() as session:
        session.add(chat_entry)
        session.commit()
        if return_dict:
            return chat_entry.to_dict()
    return chat_entry

def get_chat_by_id(chat_id, return_dict=False):
    with Session() as session:
        chat_entry = session.query(Content).filter_by(id=chat_id).first()
        if return_dict:
            return chat_entry.to_dict()
    return chat_entry
def update_chat(chat_id, messages, highlights):
    with Session() as session:
        # Retrieve the chat entry by its ID
        chat_entry = session.query(Content).filter_by(id=chat_id).first()
        if not chat_entry:
            # Chat entry not found; handle the error
            return None

        # Update the chat's content_metadata with new messages and highlights
        chat_entry.content_metadata = {
            'chat': {
                'messages': messages,
                'highlights': highlights
            }
        }

        # Commit the changes to the database
        session.commit()
    return chat_entry
def custom_merge(session: Session, content_data: Dict[str, any], filter_by: Optional[Dict[str, any]] = None) -> None:
    """
    Merge content data into the database using a custom filter.

    :param session: The SQLAlchemy session to be used for the database operation.
    :param content_data: A dictionary containing the data for the Content instance.
    :param filter_by: A dictionary containing the filter conditions to find an existing record in the database.
                      If None, the function will treat the content data as a new item to be added.
    """
    if filter_by is None:
        # Create a new Content instance and add it to the session
        new_content = prepare_new_item(session,content_data)
        session.add(new_content)
    else:
        existing_content = session.query(Content).filter_by(**filter_by).first()

        if existing_content:
            # Convert dictionaries to ORM instances
            content_data['authors'] = [construct_author(session, author_data) for author_data in content_data['authors']]
            # Add related content if provided, obviously it needs to be in content table already
            if 'related_content' in content_data:
                for related_item in content_data['related_content']:
                    existing_content = session.query(Content).get(related_item)
                    if existing_content:
                        new_content.related_content.append(existing_content)
                        content_data['related_content'] = [Content(**related_data) for related_data in content_data['related_content']]
            # Update the existing content with the new values
            for key, value in content_data.items():
                setattr(existing_content, key, value)
        else:
            # Create a new Content instance and add it to the session
            new_content = prepare_new_item(session,content_data)
            session.add(new_content)


def merge_content(content_list: List[Dict[str, any]], filter_by_key: Optional[str] = None) -> None:
    """
    Merge a list of content data into the database using a custom merge function.

    :param content_list: A list of dictionaries containing the data for the Content instances.
    :param filter_by_key: The key to be used as a filter in the custom merge function. If None, no filter will be applied.
    """
    with Session() as session:
        for content in content_list:
            print(content)
            filter_by = {filter_by_key: content[filter_by_key]} if filter_by_key else None
            custom_merge(session, content, filter_by)
        session.commit()


def delete_content(content_list: List[Dict[str, str]]) -> None:
    """
    Delete the specified content from the database.

    Args:
        content_list (List[Dict[str, str]]): A list of dictionaries containing content data.
    """
    with Session() as session:
        for content in content_list:
            if 'zotero_key' in content:
                # try deleting by zotero key first (in case the request is coming from Zotero)
                session.query(Content).filter(Content.zotero_key == content['zotero_key']).delete()
            else:
                session.query(Content).filter(Content.id == content['id']).delete()
        session.commit()

def soft_delete_content(content_list: List[Dict[str, str]]) -> None:
    """
    Soft delete the specified content by setting the 'deleted' field to True.

    Args:
        content_list (List[Dict[str, str]]): A list of dictionaries containing content data.
    """
    with Session() as session:
        for content in content_list:
            if 'zotero_key' in content:
                # try deleting by zotero key first (in case the request is coming from Zotero)
                session.query(Content).filter(Content.zotero_key == content['zotero_key']).update({"deleted": True})
            else:
                session.query(Content).filter(Content.id == content['id']).update({"deleted": True})
        session.commit()

def construct_author(session: Session, author: Dict[str, str]) -> Author:
    """
    Construct an Author instance from the provided data, or returns an existing Author instance if one exists in db.

    Args:
        session (Session): The SQLAlchemy session to be used for the database operation.
        author (Dict[str, str]): A dictionary containing the data for the Author instance.

    Returns: An Author instance.
    """
    existing_author = session.query(Author).filter_by(first_name=author['first_name'], last_name=author['last_name']).first()
    if existing_author:
        return existing_author
    else:
        new_author = Author(first_name=author['first_name'], last_name=author['last_name'])
        return new_author
    
def prepare_new_item(session: Session, content: Dict[str,str]) -> Content:
    # Create the Content object
    if 'filename' in content:
        filename = content['filename']
    else:
        filebase = content['title'].replace(' ', '_')
        if content['content_type'] in ['note', 'summary']:
            filename = f'{filebase}.md'

    new_content = Content(
        title = content['title'],
        content_type = content['content_type'],
        zotero_key = content['zotero_key'],
        zotero_version = content['zotero_version'],
        content_metadata = content['content_metadata'],
        filename = content['filename'],
        summary = content['summary'] if 'summary' in content else None,
        tags = content['tags'] if 'tags' in content else None,
        deleted = content['deleted'] if 'deleted' in content else False
    )
    # Add authors if provided
    if 'authors' in content:
        new_content.authors = [construct_author(session, author) for author in content['authors']]

    # Add related content if provided
    if 'related_content' in content:
        for related_item in content['related_content']:
            existing_content = session.query(Content).get(related_item)
            if existing_content:
                new_content.related_content.append(existing_content)

    return new_content

def store_content_list(content_list: List[Dict[str, str]], return_dict: bool=False) -> Tuple[List[Union[Content, Dict[str,str], None]], Union[str, None]]:
    """
    Store a list of content in the database.

    Args:
        content_list (List[Dict[str, str]]): A list of dictionaries containing content data.

    Returns:
        Tuple[List[Union[Content, None]], Union[str, None]]: A tuple containing a list of stored content objects or None,
                                                             and an error message if any error occurred or None.
    """
    stored_contents = []
    error_message = None

    with Session() as session:
        try:
            with session.begin():
                for content in content_list:
                    new_content = prepare_new_item(session, content)
                    # Add the Content object to the session
                    session.add(new_content)
                    stored_contents.append(new_content)
                
            session.commit()
        except Exception as e:
            print(e)
            error_message = str(e)
            session.rollback()
            stored_contents = [None] * len(content_list)
        if return_dict:
            stored_contents = [content.to_dict() for content in stored_contents]
    return stored_contents, error_message

def sync_content(new_and_modified_items: List[Dict[str, str]], deleted_items: List[Dict[str, str]], sync_key: str = 'zotero_key') -> None:
    """
    Sync content with Zotero by merging new and modified items and soft deleting deleted items.

    Args:
        new_and_modified_items (List[Dict[str, str]]): A list of dictionaries containing new and modified content data.
        deleted_items (List[Dict[str, str]]): A list of dictionaries containing deleted content data.
    """
    try:
        # Merge new and modified items
        merge_content(new_and_modified_items, filter_by_key=sync_key)
        # Soft delete deleted items
        if deleted_items:
            soft_delete_content(deleted_items)
        return None
    except Exception as e:
        print(e)
        raise(e)

def create_group_with_zotero_keys(name: str, group_type: GroupType, zotero_keys: List[str]) -> Group:
    """
    Create a new group with the specified content items.

    :param name: The name of the group.
    :param group_type: The type of the group (BaseGroup or Folio).
    :param zotero_keys: A list of zotero_keys for the content items to add to the group.
    :return: The created group instance.
    """
    with Session() as session:
        # Query the content items with the given zotero_keys
        content_items = session.query(Content).filter(Content.zotero_key.in_(zotero_keys)).all()

        # Create a new group with the specified name and group_type
        new_group = Group(name=name, group_type=group_type)

        # Add the content items to the group
        for content_item in content_items:
            new_group.content_items.append(content_item)

        # Add the group to the session and commit
        session.add(new_group)
        session.commit()

    return new_group