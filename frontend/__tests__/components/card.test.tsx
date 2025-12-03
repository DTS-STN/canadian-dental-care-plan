import { render } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/card';

describe('Card components', () => {
  it('should render correctly', () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
          <CardAction>Card Action</CardAction>
        </CardHeader>
        <CardContent>
          <p>Card Content</p>
        </CardContent>
        <CardFooter className="border-t">
          <p>Card Footer</p>
        </CardFooter>
      </Card>,
    );
    expect(container).toMatchSnapshot('expected html');
  });
});
