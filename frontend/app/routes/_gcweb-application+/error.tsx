export const handle = {
  gcweb: {
    pageId: 'CDCP-0003',
  },
};

/**
 * Error route used to test error handling.
 * TODO :: GjB :: eventually remove
 */
export default function () {
  throw new Error('Keyboard not responding. Press any key to continue.');
}
