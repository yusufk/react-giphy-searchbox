import React from 'react'
import { render, waitForElement, fireEvent } from '@testing-library/react'
import ReactGiphySearchbox from '../src/index'
import giphyTrendingGetSuccess from './fixtures/giphyTrendingGetSuccess.json'
import giphyTrendingGet404Error from './fixtures/giphyTrendingGet404Error.json'
import giphySearchGetSuccessEmpty from './fixtures/giphySearchGetSuccessEmpty.json'
import giphySearchGetSuccess from './fixtures/giphySearchGetSuccess.json'
import assetsSpinner from '../src/assets/spinner.svg'
import assetsPoweredByGiphy from '../src/assets/poweredByGiphy.png'

// TO-DO: Test the loading more (infinite scrolling)

const fetchMock = data => {
  return Promise.resolve({
    json: () => Promise.resolve(data),
  })
}

describe('ReactGiphySearchbox', () => {
  const onSelect = jest.fn()
  const onSearch = jest.fn()
  const defaults = {
    apiKey: '9Ixlv3DWC1biJRI57RanyL7RTbfzz0o7',
    gifListHeight: '300px',
    gifPerPage: 5,
    listItemClassName: '',
    listWrapperClassName: '',
    loadingImage: assetsSpinner,
    masonryConfig: [{ columns: 2, imageWidth: 120, gutter: 5 }],
    messageError: 'Oops! Something went wrong. Please, try again.',
    messageLoading: 'Loading...',
    messageNoMatches: 'No matches found.',
    onSearch,
    onSelect,
    poweredByGiphy: true,
    poweredByGiphyImage: assetsPoweredByGiphy,
    rating: 'g',
    searchFormClassName: '',
    searchPlaceholder: 'Search for GIFs',
    wrapperClassName: '',
  }

  const buildSubject = (props = defaults) =>
    render(<ReactGiphySearchbox {...props} />)

  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('fetches Giphy Api and displays gifs', async () => {
    let MasonryLayoutContainer
    window.fetch = jest
      .fn()
      .mockImplementationOnce(() => fetchMock(giphyTrendingGetSuccess))
      .mockImplementationOnce(() => fetchMock(giphySearchGetSuccessEmpty))
      .mockImplementationOnce(() => fetchMock(giphySearchGetSuccess))

    const { getByTestId } = buildSubject()

    // Loading message displayed
    expect(getByTestId('SpinnerText')).toHaveTextContent(
      defaults.messageLoading,
    )

    MasonryLayoutContainer = await waitForElement(() =>
      getByTestId('MasonryLayoutContainer'),
    )

    // Trending gif results displayed
    expect(MasonryLayoutContainer.children.length).toBe(5)
    expect(window.fetch).toHaveBeenCalledTimes(1)

    // Search something typing something on input field
    // to simulate an empty response
    fireEvent.change(getByTestId('SearchFormInput'), {
      target: { value: 'foo' },
    })

    const Alert = await waitForElement(() => getByTestId('Alert'))

    // No matcher message displayed
    expect(Alert).toHaveTextContent(defaults.messageNoMatches)
    expect(window.fetch).toHaveBeenCalledTimes(2)

    // Search something else typing something on input field
    // to simulate a full response
    fireEvent.change(getByTestId('SearchFormInput'), {
      target: { value: 'Pizza' },
    })

    MasonryLayoutContainer = await waitForElement(() =>
      getByTestId('MasonryLayoutContainer'),
    )

    // Searched gif results displayed
    expect(MasonryLayoutContainer.children.length).toBe(5)
    expect(window.fetch).toHaveBeenCalledTimes(3)
  })

  test('fetches trending gifs and returns an error', async () => {
    window.fetch = jest
      .fn()
      .mockRejectedValueOnce(() => fetchMock(giphyTrendingGet404Error))
    const { getByTestId } = buildSubject()

    expect(getByTestId('SpinnerText')).toHaveTextContent(
      defaults.messageLoading,
    )

    const Alert = await waitForElement(() => getByTestId('Alert'))

    expect(Alert).toHaveTextContent(defaults.messageError)
    expect(window.fetch).toHaveBeenCalledTimes(1)
  })

  test('dispatches the onSearch action searching some gifs', async () => {
    window.fetch = jest
      .fn()
      .mockImplementationOnce(() => fetchMock(giphyTrendingGetSuccess))
      .mockImplementationOnce(() => fetchMock(giphySearchGetSuccess))

    const { getByTestId } = buildSubject()

    await waitForElement(() => getByTestId('MasonryLayoutContainer'))

    fireEvent.change(getByTestId('SearchFormInput'), {
      target: { value: 'Pizza' },
    })

    await waitForElement(() => getByTestId('SpinnerText'))
    await waitForElement(() => getByTestId('MasonryLayoutContainer'))

    expect(onSearch).toHaveBeenLastCalledWith('Pizza')
  })
})
