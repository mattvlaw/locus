import openai
import os
import dotenv

dotenv.load_dotenv()
OPEN_AI_API_KEY = os.getenv("OPEN_AI_API_KEY")
openai.api_key = OPEN_AI_API_KEY

def build_doc_explanation_msg(doc,txt):
    if len(doc['summary']) > 0:
        return f"Please explain the following text {txt} in a few sentences using extremely simple but precise terms within the context of a document entitled {doc['title']}, \
            written by {','.join([a['first_name'] +' '+ a['last_name'] for a in doc['authors']])} with summary {doc['summary']}."
    else:
        return f"Please explain the following text {txt} in a few sentences using using extremely simple but precise terms within the context of a document entitled {doc['title']}, \
            written by {','.join([a['first_name'] +' '+ a['last_name'] for a in doc['authors']])}."

def openai_chat(messages, user, model="gpt-3.5-turbo"):
    prompt = {"role": "system", "content": "You are a helpful, academic assistant that translates academic language into plain English. If you don't know what something means, ask clarifying questions."}
    messages = [prompt] + messages
    for chunk in openai.ChatCompletion.create(
        model=model,
        messages=messages,
        temperature=0.05,
        stream=True
    ):
        content = chunk["choices"][0].get("delta", {}).get("content")
        print(chunk)
        finish_reason = chunk["choices"][0].get("finish_reason")
        
        yield {"content": content, "is_final": bool(finish_reason)}


def openai_single_prompt_chat(message, user, model="gpt-3.5-turbo"):
    messages = [
        {"role": "system", "content": "You are a helpful, academic assistant that translates academic language into plain English. If you don't know what something means, ask clarifying questions."},
        {"role": "user", "name": user, "content": message}
    ]
    for chunk in openai.ChatCompletion.create(
        model=model,
        messages=messages,
        temperature=0.05,
        stream=True
    ):
        content = chunk["choices"][0].get("delta", {}).get("content")
        print(chunk)
        finish_reason = chunk["choices"][0].get("finish_reason")
        
        yield {"content": content, "is_final": bool(finish_reason)}

def condense_history(messages):
    # condense the history into a single message
    # messages = [{"role": "user", "content": "hello"}, {"role": "system", "content": "hi"}]
    history = ""
    for m in messages:
        if m["role"] == "user":
            history += f"{m['content']} "
    return history

if __name__=='__main__':
    doc = {"title": "Research through Design as a Method for Interaction Design Research in HCI", 
           "authors": [{"first_name": "John", "last_name": "Zimmerman"}, {"first_name": "Jodi", "last_name": "Forlizzi"}, {"first_name": "Shelley", "last_name": "Evanson"}],
        #    "summary": ""
           "summary": "For years the HCI community has struggled to integrate \
                design in research and practice. While design has gained a \
                strong foothold in practice, it has had much less impact on \
                the HCI research community. In this paper we propose a \
                new model for interaction design research within HCI. \
                Following a research through design approach, designers \
                produce novel integrations of HCI research in an attempt to \
                make the right thing: a product that transforms the world \
                from its current state to a preferred state. This model allows \
                interaction designers to make research contributions based \
                on their strength in addressing under-constrained problems. \
                To formalize this model, we provide a set of four lenses for \
                evaluating the research contribution and a set of three \
                examples to illustrate the benefits of this type of research"
            }
    # txt = "This paper follows the convention of the design researchers, and we intend the term design research to mean an intention to produce knowledge and not the work to more immediately inform the development of a commercial product."
    txt = "One of the critical elements for judging the qualityof an interaction design research contribution is the process.Like anthropologists making contributions in this science-dominated domain, there is no expectation that reproducingthe process will produce the same results. Instead, part ofthe judgment of the work examines the rigor applied to themethods and the rationale for the selection of specificmethods. In documenting their contributions, interactiondesign researchers must provide enough detail that theprocess they employed can be reproduced. In addition, theymust provide a rationale for their selection of the specificmethods they employed."
    user = "Matt"

    for chunk in openai_single_prompt_chat(build_doc_explanation_msg(doc,txt), user):
        print(chunk)