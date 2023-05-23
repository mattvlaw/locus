import Quill from 'quill';

const Inline = Quill.import('blots/inline');

class CitationLinkBlot extends Inline {
  static create(value) {
    const node = super.create(value);
    node.setAttribute('href', value.url);
    node.setAttribute('data-doc-id', value.docId);
    node.classList.add('citation-link');
    node.innerHTML = value.text;
    return node;
  }
  static value(node) {
    return {
      url: node.getAttribute('href'),
      authorId: node.getAttribute('data-author-id'),
      text: node.innerHTML, // Return the innerHTML of the node
    };
  }

  static formats(node) {
    return {
      url: node.getAttribute('href'),
      docId: node.getAttribute('data-doc-id'),
    };
  }
}

CitationLinkBlot.blotName = 'citation-link';
CitationLinkBlot.tagName = 'a';

export default CitationLinkBlot;
