from api.models import Content, Author
import os


def quill2Content(item: dict, storage_path: str = None, storage_fmt: str = "html") -> Content:
    """
    Convert a delta text document to a Content object.
    """
    if storage_path is not None:
        filename = item["title"].replace(" ", "_") + f".{storage_fmt}"
        with open(os.path.join(storage_path, filename), "w") as f:
            if storage_fmt == "html":
                f.write(item["content"])
            elif storage_fmt == "delta":
                f.write(item["delta"])
            else:
                raise ValueError("storage_fmt must be 'html' or 'delta'")
    else:
        filename = None

    content = Content()
    content.id = item['id'] if 'id' in item else None,
    content.content_type = item["type"]
    content.zotero_key = None
    content.zotero_version = None
    content.title = item["title"]
    content.content_metadata = item["delta"]
    content.filename = filename
    content.summary = None
    content.tags = None
    content.deleted = False
    content.authors = [{"first_name": a["first_name"], "last_name": a["last_name"]} for a in item['authors']]
    return content

def quill2Dict(item: dict, storage_path: str = None, storage_fmt: str = "html") -> dict:
    """
    Convert a delta text document to a dictionary.
    """
    if storage_path is not None:
        filename = item["title"].replace(" ", "_") + f".{storage_fmt}"
        with open(os.path.join(storage_path, filename), "w") as f:
            if storage_fmt == "html":
                f.write(item["content"])
            elif storage_fmt == "delta":
                f.write(item["delta"])
            else:
                raise ValueError("storage_fmt must be 'html' or 'delta'")
    else:
        filename = None
    return {
        "id": item['id'] if 'id' in item else None,
        "content_type": item['type'],
        "zotero_key": None,
        "zotero_version": None,
        "title": item['title'],
        "content_metadata": item['delta'],
        "filename": filename,
        "summary": None,
        "tags": ','.join([t['tag'] for t in item['tags']]) if 'tags' in item else None,
        "deleted": False,
        "authors": [{"first_name": a["first_name"], "last_name": a["last_name"]} for a in item['authors']]
    }

def zotero2Content(item: dict) -> Content:
    """
    Convert a Zotero item to a Content object.
    
    :param item: Zotero item
    :return: Content object
    """
    content = Content()
    content.content_type = "zotero"
    content.zotero_key = item['key']
    content.zotero_version = item['version']
    content.title = item['data']['title']
    content.content_metadata = item['data']
    content.filename =  item['data']['filename'] if 'filename' in item['data'] else None
    content.summary = item['data']['abstractNote']
    content.time_created = item['data']['dateAdded']
    content.time_modified = item['data']['dateModified']
    content.tags = item['data']['tags']
    content.deleted = False
    content.authors = [{"first_name": a["firstName"], "last_name": a["lastName"]} for a in item['data']['creators']]
    return content

def zotero2Dict(item: dict) -> dict:
    """
    Convert a Zotero item to a dictionary.
    
    :param item: Zotero item
    :return: Dictionary
    """
    # print(f'{item["data"]["title"]}: {item["data"]["itemType"]}')
    # print(item["data"])
    if 'title' not in item['data'] or item['data']['title'] == '' or item['data']['title'] is None:
        print(f'Empty title: {item}')
    if item['data']['itemType'] == 'attachment':
        content_type = 'zotero_attachment' 
        summary = "attachment for " + item['data']['title']
        authors = []

    else:
        content_type = 'zotero_entry'
        summary = item['data']['abstractNote'] if 'abstractNote' in item['data'] else None
        if 'creators' in item['data']:
            for a in item['data']['creators']:
                if 'name' in a:
                    fullname = a['name']
                    firstname, lastname = fullname.split(' ', 1)
                    a['firstName'] = firstname
                    a['lastName'] = lastname
            authors = [{"first_name": a["firstName"], "last_name": a["lastName"]} for a in item['data']['creators']] if 'creators' in item['data'] else []
        else:
            authors = []
        item['data']['filename'] = None

    # add the links info to the metadata
    # print("ddddd")
    item['data']['links'] = item['links']
    return {
        "content_type": content_type,
        "zotero_key": item['key'],
        "zotero_version": item['version'],
        "title": item['data']['title'] if 'title' in item['data'] else None,
        "content_metadata": item['data'],
        "filename": item['data']['filename'] if 'filename' in item['data'] else None,
        "summary": summary,
        # "time_created": item['data']['dateAdded'],
        # "time_modified": item['data']['dateModified'],
        "tags": ','.join([t['tag'] for t in item['data']['tags']]),
        "deleted": False,
        "authors": authors
    }
