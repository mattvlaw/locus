from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime, Table, JSON, Enum
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash


Base = declarative_base()

# Association table for the many-to-many relationship between content and authors
content_authors = Table(
    'content_authors',
    Base.metadata,
    Column('content_id', Integer, ForeignKey('content.id')),
    Column('author_id', Integer, ForeignKey('authors.id'))
)

# Association table for relationiships between content items, e.g. a paper and a chat transcript and a note
content_association = Table(
    'content_association',
    Base.metadata,
    Column('content_id1', Integer, ForeignKey('content.id'), primary_key=True),
    Column('content_id2', Integer, ForeignKey('content.id'), primary_key=True)
)

GroupContent = Table(
    'group_content',
    Base.metadata,
    Column('group_id', Integer, ForeignKey('groups.id'), primary_key=True),
    Column('content_id', Integer, ForeignKey('content.id'), primary_key=True)
)


class Author(Base):
    __tablename__ = 'authors'
    id = Column(Integer, primary_key=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    contents = relationship('Content', secondary=content_authors, back_populates='authors')
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    user = relationship('User', back_populates='author', uselist=False)


    def __repr__(self):
        return f"<Creator(id={self.id}, content_id={self.content_id}, creator_type='{self.creator_type}', name='{self.name}')>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
        }
    
class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String(120), unique=True, nullable=False)
    password_hash = Column(String(128), nullable=False)
    is_active = Column(Boolean, default=True)
    author = relationship('Author', back_populates='user', uselist=False)
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    def get_id(self):
        return self.id
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'first_name': self.author.first_name,
            'last_name': self.author.last_name,
            'author_id': self.author.id,
        }

# class GroupContent(Base):
#     __tablename__ = 'group_content'
#     group_id = Column(Integer, ForeignKey('groups.id'), primary_key=True)
#     content_id = Column(Integer, ForeignKey('content.id'), primary_key=True)

#     def __repr__(self):
#         return f"<GroupContent(group_id={self.group_id}, content_id={self.content_id})>"

#     def to_dict(self):
#         return {
#             'group_id': self.group_id,
#             'content_id': self.content_id,
#         }

class Content(Base):
    __tablename__ = 'content'
    id = Column(Integer, primary_key=True)
    zotero_key = Column(String(50), nullable=True, unique=True)
    zotero_version = Column(Integer, nullable=True)
    content_metadata = Column(JSON, nullable=True) # use this for the zotero data
    title = Column(String(200), nullable=False)
    content_type = Column(String(50), nullable=False) # zotero, pdf, note, summary, diagram, chat, etc.
    filename = Column(String(200), nullable=True) # associated file for the content
    summary = Column(Text, nullable=True) # additional info for the content
    tags = Column(Text, nullable=True)
    time_created = Column(DateTime, default=datetime.utcnow)
    time_modified = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted = Column(Boolean, default=False)
    

    # Many-to-many relationship with the Authors table
    authors = relationship('Author', secondary=content_authors, back_populates='contents')

    # Related content in this table
    # related_content = relationship(
    #     'Content',
    #     secondary=content_association,
    #     primaryjoin=id == content_association.c.content_id1,
    #     secondaryjoin=id == content_association.c.content_id2,
    #     backref='related_to'
    # )
    groups = relationship('Group', secondary=GroupContent, back_populates='content_items')

    def __repr__(self):
        return f"<Content(id={self.id}, title='{self.title}', content_type='{self.content_type}')>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'zotero_key': self.zotero_key,
            'zotero_version': self.zotero_version,
            'content_metadata': self.content_metadata,
            'title': self.title,
            'content_type': self.content_type,
            'filename': self.filename,
            'summary': self.summary,
            'tags': self.tags,
            'time_created': self.time_created,
            'time_modified': self.time_modified,
            'deleted': self.deleted,
            'authors': [author.to_dict() for author in self.authors],
            'groups': [group.to_dict() for group in self.groups],
            # 'related_content': [related.to_dict() for related in self.related_content],
        }

class GroupType(Enum):
    BASE_GROUP = 'base_group'
    FOLIO = 'folio'

class Group(Base):
    __tablename__ = 'groups'
    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    group_type = Column(GroupType, nullable=False)
    # Many-to-many relationship with the Content table
    content_items = relationship('Content', secondary=GroupContent, back_populates='groups')

    def __repr__(self):
        return f"<Group(id={self.id}, name='{self.name}', group_type='{self.group_type}')>"

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'group_type': self.group_type.value,
        }
    



class ZoteroVersion(Base):
    __tablename__ = 'zotero_version'

    id = Column(Integer, primary_key=True)
    version = Column(Integer, nullable=False)
    timestamp = Column(DateTime, nullable=False)