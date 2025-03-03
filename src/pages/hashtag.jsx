import {
  FocusableItem,
  Menu,
  MenuDivider,
  MenuGroup,
  MenuItem,
} from '@szhsin/react-menu';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useNavigate, useParams } from 'react-router-dom';

import Icon from '../components/icon';
import Timeline from '../components/timeline';
import { api } from '../utils/api';
import showToast from '../utils/show-toast';
import states from '../utils/states';
import { saveStatus } from '../utils/states';
import useTitle from '../utils/useTitle';

const LIMIT = 20;

// Limit is 4 per "mode"
// https://github.com/mastodon/mastodon/issues/15194
// Hard-coded https://github.com/mastodon/mastodon/blob/19614ba2477f3d12468f5ec251ce1cc5f8c6210c/app/models/tag_feed.rb#L4
const TAGS_LIMIT_PER_MODE = 4;
const TOTAL_TAGS_LIMIT = TAGS_LIMIT_PER_MODE + 1;

function Hashtags(props) {
  const navigate = useNavigate();
  let { hashtag, ...params } = useParams();
  if (props.hashtag) hashtag = props.hashtag;
  let hashtags = hashtag.trim().split(/[\s+]+/);
  hashtags.sort();
  hashtag = hashtags[0];

  const { masto, instance, authenticated } = api({
    instance: props?.instance || params.instance,
  });
  const { authenticated: currentAuthenticated } = api();
  const hashtagTitle = hashtags.map((t) => `#${t}`).join(' ');
  const title = instance ? `${hashtagTitle} on ${instance}` : hashtagTitle;
  useTitle(title, `/:instance?/t/:hashtag`);
  const latestItem = useRef();

  const hashtagsIterator = useRef();
  async function fetchHashtags(firstLoad) {
    if (firstLoad || !hashtagsIterator.current) {
      hashtagsIterator.current = masto.v1.timelines.listHashtag(hashtag, {
        limit: LIMIT,
        any: hashtags.slice(1),
      });
    }
    const results = await hashtagsIterator.current.next();
    const { value } = results;
    if (value?.length) {
      if (firstLoad) {
        latestItem.current = value[0].id;
      }

      value.forEach((item) => {
        saveStatus(item, instance);
      });
    }
    return results;
  }

  async function checkForUpdates() {
    try {
      const results = await masto.v1.timelines
        .listHashtag(hashtag, {
          limit: 1,
          any: hashtags.slice(1),
          since_id: latestItem.current,
        })
        .next();
      const { value } = results;
      if (value?.length) {
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  const [followUIState, setFollowUIState] = useState('default');
  const [info, setInfo] = useState();
  // Get hashtag info
  useEffect(() => {
    (async () => {
      try {
        const info = await masto.v1.tags.fetch(hashtag);
        console.log(info);
        setInfo(info);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [hashtag]);

  const reachLimit = hashtags.length >= TOTAL_TAGS_LIMIT;

  return (
    <Timeline
      key={instance + hashtagTitle}
      title={title}
      titleComponent={
        !!instance && (
          <h1 class="header-account">
            <b>{hashtagTitle}</b>
            <div>{instance}</div>
          </h1>
        )
      }
      id="hashtag"
      instance={instance}
      emptyText="No one has posted anything with this tag yet."
      errorText="Unable to load posts with this tag"
      fetchItems={fetchHashtags}
      checkForUpdates={checkForUpdates}
      useItemID
      headerEnd={
        <Menu
          portal={{
            target: document.body,
          }}
          setDownOverflow
          overflow="auto"
          viewScroll="close"
          position="anchor"
          boundingBoxPadding="8 8 8 8"
          menuButton={
            <button type="button" class="plain">
              <Icon icon="more" size="l" />
            </button>
          }
        >
          {!!info && hashtags.length === 1 && (
            <>
              <MenuItem
                disabled={followUIState === 'loading' || !authenticated}
                onClick={() => {
                  setFollowUIState('loading');
                  if (info.following) {
                    const yes = confirm(`Unfollow #${hashtag}?`);
                    if (!yes) {
                      setFollowUIState('default');
                      return;
                    }
                    masto.v1.tags
                      .unfollow(hashtag)
                      .then(() => {
                        setInfo({ ...info, following: false });
                        showToast(`Unfollowed #${hashtag}`);
                      })
                      .catch((e) => {
                        alert(e);
                        console.error(e);
                      })
                      .finally(() => {
                        setFollowUIState('default');
                      });
                  } else {
                    masto.v1.tags
                      .follow(hashtag)
                      .then(() => {
                        setInfo({ ...info, following: true });
                        showToast(`Followed #${hashtag}`);
                      })
                      .catch((e) => {
                        alert(e);
                        console.error(e);
                      })
                      .finally(() => {
                        setFollowUIState('default');
                      });
                  }
                }}
              >
                {info.following ? (
                  <>
                    <Icon icon="check-circle" /> <span>Following…</span>
                  </>
                ) : (
                  <>
                    <Icon icon="plus" /> <span>Follow</span>
                  </>
                )}
              </MenuItem>
              <MenuDivider />
            </>
          )}
          <FocusableItem className="menu-field" disabled={reachLimit}>
            {({ ref }) => (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const newHashtag = e.target[0].value?.trim?.();
                  // Use includes but need to be case insensitive
                  if (
                    newHashtag &&
                    !hashtags.some(
                      (t) => t.toLowerCase() === newHashtag.toLowerCase(),
                    )
                  ) {
                    hashtags.push(newHashtag);
                    hashtags.sort();
                    navigate(
                      instance
                        ? `/${instance}/t/${hashtags.join('+')}`
                        : `/t/${hashtags.join('+')}`,
                    );
                  }
                }}
              >
                <Icon icon="hashtag" />
                <input
                  ref={ref}
                  type="text"
                  placeholder={
                    reachLimit ? `Max ${TOTAL_TAGS_LIMIT} tags` : 'Add hashtag'
                  }
                  required
                  autocorrect="off"
                  autocapitalize="off"
                  spellcheck={false}
                  // no spaces, no hashtags
                  pattern="[^#][^\s#]+[^#]"
                  disabled={reachLimit}
                />
              </form>
            )}
          </FocusableItem>
          <MenuGroup takeOverflow>
            {hashtags.map((t, i) => (
              <MenuItem
                key={t}
                disabled={hashtags.length === 1}
                onClick={(e) => {
                  hashtags.splice(i, 1);
                  hashtags.sort();
                  navigate(
                    instance
                      ? `/${instance}/t/${hashtags.join('+')}`
                      : `/t/${hashtags.join('+')}`,
                  );
                }}
              >
                <Icon icon="x" alt="Remove hashtag" class="danger-icon" />
                <span>
                  <span class="more-insignificant">#</span>
                  {t}
                </span>
              </MenuItem>
            ))}
          </MenuGroup>
          <MenuDivider />
          <MenuItem
            disabled={!currentAuthenticated}
            onClick={() => {
              const shortcut = {
                type: 'hashtag',
                hashtag: hashtags.join(' '),
                instance,
              };
              // Check if already exists
              const exists = states.shortcuts.some(
                (s) =>
                  s.type === shortcut.type &&
                  s.hashtag
                    .split(/[\s+]+/)
                    .sort()
                    .join(' ') ===
                    shortcut.hashtag
                      .split(/[\s+]+/)
                      .sort()
                      .join(' ') &&
                  (s.instance ? s.instance === shortcut.instance : true),
              );
              if (exists) {
                alert('This shortcut already exists');
              } else {
                states.shortcuts.push(shortcut);
                showToast(`Hashtag shortcut added`);
              }
            }}
          >
            <Icon icon="shortcut" /> <span>Add to Shorcuts</span>
          </MenuItem>
          <MenuItem
            onClick={() => {
              let newInstance = prompt(
                'Enter a new instance e.g. "mastodon.social"',
              );
              if (!/\./.test(newInstance)) {
                if (newInstance) alert('Invalid instance');
                return;
              }
              if (newInstance) {
                newInstance = newInstance.toLowerCase().trim();
                navigate(`/${newInstance}/t/${hashtags.join('+')}`);
              }
            }}
          >
            <Icon icon="bus" /> <span>Go to another instance…</span>
          </MenuItem>
        </Menu>
      }
    />
  );
}

export default Hashtags;
