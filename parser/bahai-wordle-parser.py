import re
import collections
import os
import json

text_file = open("hidden_words.txt", "r", encoding="utf8")
data = text_file.read()
text_file.close()

original_hidden_words = data.split("\n\n")
hidden_words = [x.split("\n")[1] for x in original_hidden_words]
parsed = {
    'hidden_words': {},
    'words': {}
}

for current_id, hidden_word in enumerate(hidden_words):
    parsed['hidden_words'][current_id] = original_hidden_words[current_id]

    words = re.sub("[^\w]", " ",  hidden_word).lower().split()
    for word in words:
        if len(word) < 5 or len(word) > 6:
            continue
        if word in parsed['words']:
            if current_id in set(parsed['words'][word]):
                continue
            parsed['words'][word].append(current_id)
        else:
            parsed['words'][word] = [current_id]

# with open('parsed_quotes.json', 'w') as outfile:
#     json.dump(parsed, outfile)

with open('quotes.json', 'w') as outfile:
    hw = [{
        'id': i,
        'quote': x,
        'used': False,
        'current': False,
    } for i,x in enumerate(original_hidden_words)]
    json.dump(hw, outfile)

with open('words.json', 'w') as outfile:
    keys = parsed['words'].keys()

    w = [{
        'id': i,
        'word': x,
        'quote_ids': parsed['words'][x],
        'length': len(x),
        'used': False,
        'current': False,
        
    } for i,x in enumerate(keys)]
    json.dump(w, outfile)
