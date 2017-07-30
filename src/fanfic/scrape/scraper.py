import requests, json, time, re
from bs4 import BeautifulSoup


def get_genres(genre_text):
    if genre_text.startswith('Chapters'):
        return []
    genres = genre_text.split('/')
    # Hurt/Comfort is annoying because of the '/'
    corrected_genres = []
    for genre in genres:
        if genre == 'Hurt':
            corrected_genres.append('Hurt/Comfort')
        elif genre == 'Comfort':
            continue
        else:
            corrected_genres.append(genre)
    return corrected_genres


#def is_last_page(soup):
#    pattern = re.compile(r'Last')
#    pattern2 = re.compile(r'Next')
#    last_findings = soup.find('a', text=pattern)
#    next_findings = soup.find('a', text=pattern2)
#    if last_findings is None and next_findings is None:
#        return True
#    else:
#        return False


def scrape_all_stories_on_page(url, metadata_list):
    # names of the classes on fanfiction.net
    story_root_class = 'z-list zhover zpointer '

    html = requests.get(url).content
    soup = BeautifulSoup(html, "html.parser")

    # get last page
    #last_page = is_last_page(soup)

    # get all the stories on the page
    all_stories_on_page = soup.find_all('div', class_=story_root_class)

    for story in all_stories_on_page:
        story_id, metadata = scrape_story_blurb(story)
        metadata_list[story_id] = metadata
    return metadata_list


def scrape_story_blurb(story):
    # names of the classes on fanfiction.net
    title_class = 'stitle'
    metadata_div_class = 'z-padtop2 xgray'
    backup_metadata_div_class = 'z-indent z-padtop'

    title = story.find(class_=title_class).get_text()
    story_id = story.find(class_=title_class)['href'].split("/")[2]

    # some steps to get to the author id
    links = story.find_all('a')
    author_url = [link['href'] for link in links if "/u/" in link['href']]
    try:
        author_id = author_url[0].split("/")[2]
    except:
        author_id = "NOTAVAILABLE"

    metadata_div = story.find('div', class_=metadata_div_class)

    # this happened once, on story ID 268931
    if metadata_div is None:
        metadata_div = story.find('div', class_=backup_metadata_div_class)
        start_idx = metadata_div.text.index('Rated')
        metadata_div_text = metadata_div.text[start_idx:]
    else:
        metadata_div_text = metadata_div.get_text()

    times = metadata_div.find_all(attrs={'data-xutime': True})
    if len(times) == 2:
        updated = times[0]['data-xutime']
        published = times[1]['data-xutime']
    else:
        updated = times[0]['data-xutime']
        published = updated

    metadata_parts = metadata_div_text.split('-')
    genres = get_genres(metadata_parts[2].strip())

    language = metadata_parts[1].strip()

    metadata = {
        'author_id': author_id,
        'title': title,
        'updated': int(updated),
        'published': int(published),
        'language': language,
        'genres': genres
    }

    for parts in metadata_parts:
        parts = parts.strip()
        # already dealt with language and genres- everything else should have name: value
        tag_and_val = parts.split(':')
        if len(tag_and_val) != 2:
            continue
        tag, val = tag_and_val
        tag = tag.strip().lower()
        if tag not in metadata:
            val = val.strip()
            try:
                val = int(val.replace(',', ''))
                metadata['num_' + tag] = val
            except:
                metadata[tag] = val

    # see if we have characters and/or completion
    last_part = metadata_parts[len(metadata_parts) - 1].strip()
    if last_part == 'Complete':
        metadata['status'] = 'Complete'
        # have to get the second to last now
        metadata['characters'] = get_characters_from_string(metadata_parts[len(metadata_parts) - 2])
    else:
        metadata['status'] = 'Incomplete'
        metadata['characters'] = get_characters_from_string(last_part)

    return story_id, metadata


def get_characters_from_string(string):
    stripped = string.strip()
    if stripped.find('[') == -1:
        return stripped.split(', ')
    else:
        characters = []
        num_pairings = stripped.count('[')
        for idx in range(0, num_pairings):
            open_bracket = stripped.find('[')
            close_bracket = stripped.find(']')
            characters.append(get_characters_from_string(stripped[open_bracket+1:close_bracket]))
            stripped = stripped[close_bracket+1:]
        if stripped != '':
            singles = get_characters_from_string(stripped)
            [characters.append(character) for character in singles]
        return characters


def main():
    # we're only going to look at harry potter fanfics
    base_url = "https://www.fanfiction.net/book/Harry-Potter"
    # this gets appended in order to
    page_suffix = "?&srt=1&r=103&p="

    # 2 seconds seems reasonable for a human to quickly scroll through a page
    rate_limit = 2

    metadata_list = {}
    first_page = 1
    last_page = 23521
    pages = range(last_page, first_page - 1, -1)
    for page in pages:
        # log
        print("Scraping page {0}".format(page))

        # build the url
        url = '{0}/{1}{2}'.format(base_url, page_suffix, str(page))

        # and let's go!
        metadata_list= scrape_all_stories_on_page(url, metadata_list)

        # sleep to be good about terms of service
        time.sleep(rate_limit)

    filename = 'data.json'
    with open(filename, 'w') as outfile:
        json.dump(metadata_list, outfile)


if __name__ == "__main__":
    main()