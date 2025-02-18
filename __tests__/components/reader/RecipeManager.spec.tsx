import { waitForDomChange, fireEvent, render } from '@testing-library/react';
import { MemoryRouter, Switch, Route } from 'react-router-dom';
import { RecipeManager } from 'components/reader/RecipeManager';
import { defaultRecipe } from 'lib/reader/recipes';
import { Illuminsight } from 'types';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { reducer } from 'store/reducers';
import localForage from 'localforage';
import * as React from 'react';
import axios from 'axios';

test('<RecipeManager>', async () => {
  // Mock loading recipe index
  const mockGet = ((axios as any).get = jest.fn());
  mockGet.mockResolvedValueOnce({
    data: [
      { i: 'test' },
      { i: 'hello-world', b: 'books' },
      { i: 'foo-bar', a: 'authors' },
      { i: 'lorem', s: 'series' },
    ],
  });

  // Wrap <RecipeManager>
  const store = createStore(reducer);
  const { getByLabelText, getAllByText, getByText } = render(
    <MemoryRouter initialEntries={['/read/1234']}>
      <Provider store={store}>
        <Switch>
          <Route path="/read/:pubId" component={RecipeManager} />
        </Switch>
      </Provider>
    </MemoryRouter>,
  );
  await waitForDomChange();

  // Validate recipes were loaded
  getByText('test');
  getByText('hello world');
  getByText('foo bar');
  getByText('lorem');

  // Search for recipe
  fireEvent.change(getByLabelText('Search'), { target: { value: 'series' } });

  // Validate search results
  getByText('lorem');
  expect(() => getByText('test')).toThrow();
  expect(() => getByText('hello world')).toThrow();
  expect(() => getByText('foo bar')).toThrow();

  // Mock downloading and saving recipe
  const recipe: Illuminsight.Recipe = { id: 'lorem', wikis: [], searches: [] };
  mockGet.mockResolvedValueOnce({ data: recipe });
  const mockSetItem = ((localForage as any).setItem = jest.fn());
  mockSetItem.mockResolvedValueOnce(undefined);

  // Set recipe
  fireEvent.click(getByText('lorem'));
  await waitForDomChange();

  // Validate recipe was downloaded and saved
  expect(mockGet).toHaveBeenCalledTimes(2);
  expect(mockGet.mock.calls[1][0]).toInclude('dist/recipes/lorem.min.json');
  expect(mockSetItem).toHaveBeenCalledTimes(1);
  expect(mockSetItem).toHaveBeenCalledWith('pub-recipe-1234', recipe);

  // Validate recipe is displayed as active
  expect(getAllByText('lorem')).toBeArrayOfSize(2);

  // Mock removing recipe (replacing with default)
  mockSetItem.mockResolvedValueOnce(undefined);

  // Remove active recipe
  fireEvent.click(getAllByText('lorem')[0]);
  await waitForDomChange();

  // Validate recipe was deleted and state was reset to default
  expect(mockSetItem).toHaveBeenCalledTimes(2);
  expect(mockSetItem).toHaveBeenNthCalledWith(
    2,
    'pub-recipe-1234',
    defaultRecipe,
  );

  // Validate there's no active recipe
  expect(getAllByText('lorem')).toBeArrayOfSize(1);
});
