import { Menu, MenuItem } from '@szhsin/react-menu';
import { getBlurHashAverageColor } from 'fast-blurhash';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { useHotkeys } from 'react-hotkeys-hook';

import Icon from './icon';
import Link from './link';
import Media from './media';
import MenuLink from './menu-link';
import Modal from './modal';
import TranslationBlock from './translation-block';

function MediaModal({
  mediaAttachments,
  statusID,
  instance,
  index = 0,
  onClose = () => {},
}) {
  const carouselRef = useRef(null);

  const [currentIndex, setCurrentIndex] = useState(index);
  const carouselFocusItem = useRef(null);
  useLayoutEffect(() => {
    carouselFocusItem.current?.scrollIntoView();

    // history.pushState({ mediaModal: true }, '');
    // const handlePopState = (e) => {
    //   if (e.state?.mediaModal) {
    //     onClose();
    //   }
    // };
    // window.addEventListener('popstate', handlePopState);
    // return () => {
    //   window.removeEventListener('popstate', handlePopState);
    // };
  }, []);
  const prevStatusID = useRef(statusID);
  useEffect(() => {
    const scrollLeft = index * carouselRef.current.clientWidth;
    const differentStatusID = prevStatusID.current !== statusID;
    if (differentStatusID) prevStatusID.current = statusID;
    carouselRef.current.scrollTo({
      left: scrollLeft,
      behavior: differentStatusID ? 'auto' : 'smooth',
    });
  }, [index, statusID]);

  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    let handleSwipe = () => {
      onClose();
    };
    if (carouselRef.current) {
      carouselRef.current.addEventListener('swiped-down', handleSwipe);
    }
    return () => {
      if (carouselRef.current) {
        carouselRef.current.removeEventListener('swiped-down', handleSwipe);
      }
    };
  }, []);

  useHotkeys('esc', onClose, [onClose]);

  const [showMediaAlt, setShowMediaAlt] = useState(false);

  useEffect(() => {
    let handleScroll = () => {
      const { clientWidth, scrollLeft } = carouselRef.current;
      const index = Math.round(scrollLeft / clientWidth);
      setCurrentIndex(index);
    };
    if (carouselRef.current) {
      carouselRef.current.addEventListener('scroll', handleScroll, {
        passive: true,
      });
    }
    return () => {
      if (carouselRef.current) {
        carouselRef.current.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  useEffect(() => {
    let timer = setTimeout(() => {
      carouselRef.current?.focus?.();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div class="media-modal-container">
      <div
        ref={carouselRef}
        tabIndex="-1"
        data-swipe-threshold="44"
        class="carousel"
        onClick={(e) => {
          if (
            e.target.classList.contains('carousel-item') ||
            e.target.classList.contains('media') ||
            e.target.classList.contains('media-zoom')
          ) {
            onClose();
          }
        }}
      >
        {mediaAttachments?.map((media, i) => {
          const { blurhash } = media;
          const rgbAverageColor = blurhash
            ? getBlurHashAverageColor(blurhash)
            : null;
          return (
            <div
              class="carousel-item"
              style={{
                '--average-color': `rgb(${rgbAverageColor?.join(',')})`,
                '--average-color-alpha': `rgba(${rgbAverageColor?.join(
                  ',',
                )}, .5)`,
              }}
              tabindex="0"
              key={media.id}
              ref={i === currentIndex ? carouselFocusItem : null}
              onClick={(e) => {
                if (e.target !== e.currentTarget) {
                  setShowControls(!showControls);
                }
              }}
            >
              {!!media.description && (
                <button
                  type="button"
                  class="plain2 media-alt"
                  hidden={!showControls}
                  onClick={() => {
                    setShowMediaAlt(media.description);
                  }}
                >
                  <Icon icon="info" />
                  <span class="media-alt-desc">{media.description}</span>
                </button>
              )}
              <Media media={media} showOriginal />
            </div>
          );
        })}
      </div>
      <div class="carousel-top-controls" hidden={!showControls}>
        <span>
          <button
            type="button"
            class="carousel-button plain3"
            onClick={() => onClose()}
          >
            <Icon icon="x" />
          </button>
        </span>
        {mediaAttachments?.length > 1 ? (
          <span class="carousel-dots">
            {mediaAttachments?.map((media, i) => (
              <button
                key={media.id}
                type="button"
                disabled={i === currentIndex}
                class={`plain3 carousel-dot ${
                  i === currentIndex ? 'active' : ''
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  carouselRef.current.scrollTo({
                    left: carouselRef.current.clientWidth * i,
                    behavior: 'smooth',
                  });
                }}
              >
                &bull;
              </button>
            ))}
          </span>
        ) : (
          <span />
        )}
        <span>
          <Menu
            overflow="auto"
            align="end"
            position="anchor"
            boundingBoxPadding="8 8 8 8"
            offsetY={4}
            menuClassName="glass-menu"
            menuButton={
              <button type="button" class="carousel-button plain3">
                <Icon icon="more" alt="More" />
              </button>
            }
          >
            <MenuLink
              href={
                mediaAttachments[currentIndex]?.remoteUrl ||
                mediaAttachments[currentIndex]?.url
              }
              class="carousel-button plain3"
              target="_blank"
              title="Open original media in new window"
            >
              <Icon icon="popout" />
              <span>Open original media</span>
            </MenuLink>
          </Menu>{' '}
          <Link
            to={`${instance ? `/${instance}` : ''}/s/${statusID}${
              window.matchMedia('(min-width: calc(40em + 350px))').matches
                ? `?media=${currentIndex + 1}`
                : ''
            }`}
            class="button carousel-button media-post-link plain3"
            onClick={() => {
              // if small screen (not media query min-width 40em + 350px), run onClose
              if (
                !window.matchMedia('(min-width: calc(40em + 350px))').matches
              ) {
                onClose();
              }
            }}
          >
            <span class="button-label">See post </span>&raquo;
          </Link>
        </span>
      </div>
      {mediaAttachments?.length > 1 && (
        <div class="carousel-controls" hidden={!showControls}>
          <button
            type="button"
            class="carousel-button plain3"
            hidden={currentIndex === 0}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              carouselRef.current.scrollTo({
                left: carouselRef.current.clientWidth * (currentIndex - 1),
                behavior: 'smooth',
              });
            }}
          >
            <Icon icon="arrow-left" />
          </button>
          <button
            type="button"
            class="carousel-button plain3"
            hidden={currentIndex === mediaAttachments.length - 1}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              carouselRef.current.scrollTo({
                left: carouselRef.current.clientWidth * (currentIndex + 1),
                behavior: 'smooth',
              });
            }}
          >
            <Icon icon="arrow-right" />
          </button>
        </div>
      )}
      {!!showMediaAlt && (
        <Modal
          class="light"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowMediaAlt(false);
            }
          }}
        >
          <MediaAltModal
            alt={showMediaAlt}
            onClose={() => setShowMediaAlt(false)}
          />
        </Modal>
      )}
    </div>
  );
}

function MediaAltModal({ alt, onClose }) {
  const [forceTranslate, setForceTranslate] = useState(false);
  return (
    <div class="sheet">
      {!!onClose && (
        <button type="button" class="sheet-close outer" onClick={onClose}>
          <Icon icon="x" />
        </button>
      )}
      <header class="header-grid">
        <h2>Media description</h2>
        <div class="header-side">
          <Menu
            align="end"
            menuButton={
              <button type="button" class="plain4">
                <Icon icon="more" alt="More" size="xl" />
              </button>
            }
          >
            <MenuItem
              disabled={forceTranslate}
              onClick={() => {
                setForceTranslate(true);
              }}
            >
              <Icon icon="translate" />
              <span>Translate</span>
            </MenuItem>
          </Menu>
        </div>
      </header>
      <main>
        <p
          style={{
            whiteSpace: 'pre-wrap',
          }}
        >
          {alt}
        </p>
        {forceTranslate && (
          <TranslationBlock forceTranslate={forceTranslate} text={alt} />
        )}
      </main>
    </div>
  );
}

export default MediaModal;
