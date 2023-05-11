import { useEffect, useRef, useState } from 'preact/hooks';

import { api } from '../utils/api';

import Icon from './icon';

function ListAddEdit({ list, onClose }) {
  const { masto } = api();
  const [uiState, setUiState] = useState('default');
  const editMode = !!list;
  const nameFieldRef = useRef();
  const repliesPolicyFieldRef = useRef();
  useEffect(() => {
    if (editMode) {
      nameFieldRef.current.value = list.title;
      repliesPolicyFieldRef.current.value = list.repliesPolicy;
    }
  }, [editMode]);
  return (
    <div class="sheet">
      {!!onClose && (
        <button type="button" class="sheet-close" onClick={onClose}>
          <Icon icon="x" />
        </button>
      )}{' '}
      <header>
        <h2>{editMode ? 'Edit list' : 'New list'}</h2>
      </header>
      <main>
        <form
          class="list-form"
          onSubmit={(e) => {
            e.preventDefault(); // Get form values

            const formData = new FormData(e.target);
            const title = formData.get('title');
            const repliesPolicy = formData.get('replies_policy');
            console.log({
              title,
              repliesPolicy,
            });
            setUiState('loading');

            (async () => {
              try {
                let listResult;

                if (editMode) {
                  listResult = await masto.v1.lists.update(list.id, {
                    title,
                    replies_policy: repliesPolicy,
                  });
                } else {
                  listResult = await masto.v1.lists.create({
                    title,
                    replies_policy: repliesPolicy,
                  });
                }

                console.log(listResult);
                setUiState('default');
                onClose?.({
                  state: 'success',
                  list: listResult,
                });
              } catch (e) {
                console.error(e);
                setUiState('error');
                alert(
                  editMode ? 'Unable to edit list.' : 'Unable to create list.',
                );
              }
            })();
          }}
        >
          <div class="list-form-row">
            <label for="list-title">
              Name{' '}
              <input
                ref={nameFieldRef}
                type="text"
                id="list-title"
                name="title"
                required
                disabled={uiState === 'loading'}
              />
            </label>
          </div>
          <div class="list-form-row">
            <select
              ref={repliesPolicyFieldRef}
              name="replies_policy"
              required
              disabled={uiState === 'loading'}
            >
              <option value="list">Show replies to list members</option>
              <option value="followed">Show replies to people I follow</option>
              <option value="none">Don't show replies</option>
            </select>
          </div>
          <div class="list-form-footer">
            <button type="submit" disabled={uiState === 'loading'}>
              {editMode ? 'Save' : 'Create'}
            </button>
            {editMode && (
              <button
                type="button"
                class="light danger"
                disabled={uiState === 'loading'}
                onClick={() => {
                  const yes = confirm('Delete this list?');
                  if (!yes) return;
                  setUiState('loading');

                  (async () => {
                    try {
                      await masto.v1.lists.remove(list.id);
                      setUiState('default');
                      onClose?.({
                        state: 'deleted',
                      });
                    } catch (e) {
                      console.error(e);
                      setUiState('error');
                      alert('Unable to delete list.');
                    }
                  })();
                }}
              >
                Delete…
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}

export default ListAddEdit;
