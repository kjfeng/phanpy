import './name-text.css';

import emojifyText from '../utils/emojify-text';
import states from '../utils/states';

import Avatar from './avatar';

function NameText({
  account,
  instance,
  showAvatar,
  showAcct,
  short,
  external,
  onClick,
}) {
  const { acct, avatar, avatarStatic, id, url, displayName, emojis, bot } =
    account;
  let { username } = account;

  const displayNameWithEmoji = emojifyText(displayName, emojis);

  const trimmedUsername = username.toLowerCase().trim();
  const trimmedDisplayName = (displayName || '').toLowerCase().trim();
  const shortenedDisplayName = trimmedDisplayName
    .replace(/(\:(\w|\+|\-)+\:)(?=|[\!\.\?]|$)/g, '') // Remove shortcodes, regex from https://regex101.com/r/iE9uV0/1
    .replace(/\s+/g, '') // E.g. "My name" === "myname"
    .replace(/[^a-z0-9]/gi, ''); // Remove non-alphanumeric characters

  if (
    !short &&
    (trimmedUsername === trimmedDisplayName ||
      trimmedUsername === shortenedDisplayName)
  ) {
    username = null;
  }

  return (
    <a
      class={`name-text ${showAcct ? 'show-acct' : ''} ${short ? 'short' : ''}`}
      href={url}
      target={external ? '_blank' : null}
      title={`@${acct}`}
      onClick={(e) => {
        if (external) return;
        e.preventDefault();
        if (onClick) return onClick(e);
        states.showAccount = {
          account,
          instance,
        };
      }}
    >
      {showAvatar && (
        <>
          <Avatar url={avatarStatic || avatar} squircle={bot} />{' '}
        </>
      )}
      {displayName && !short ? (
        <>
          <b
            dangerouslySetInnerHTML={{
              __html: displayNameWithEmoji,
            }}
          />
          {!showAcct && username && (
            <>
              {' '}
              <i>@{username}</i>
            </>
          )}
        </>
      ) : short ? (
        <i>@{username}</i>
      ) : (
        <b>@{username}</b>
      )}
      {showAcct && (
        <>
          <br />
          <i>@{acct}</i>
        </>
      )}
    </a>
  );
}

export default NameText;
