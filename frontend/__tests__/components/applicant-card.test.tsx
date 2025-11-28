import { render } from '@testing-library/react';

import { describe, expect, it, vi } from 'vitest';

import { ApplicantCard, ApplicantCardBody, ApplicantCardFooter, ApplicantCardHeader, ApplicantCardTitle } from '~/components/applicant-card';
import { StatusTag } from '~/components/status-tag';

vi.mock('~/components/status-tag', () => ({
  StatusTag: ({ status }: { status: string }) => (
    <div data-testid="status-tag" data-status={status}>
      Status: {status}
    </div>
  ),
}));

describe('ApplicantCard', () => {
  it('should render a basic card with all components', () => {
    const { container } = render(
      <ApplicantCard>
        <ApplicantCardHeader>
          <ApplicantCardTitle>John Doe</ApplicantCardTitle>
          <StatusTag status="complete" />
        </ApplicantCardHeader>
        <ApplicantCardBody>
          <p>Primary applicant information</p>
          <ul>
            <li>Date of birth: January 1, 1980</li>
            <li>Status: Completed</li>
          </ul>
        </ApplicantCardBody>
        <ApplicantCardFooter>
          <button>Edit Information</button>
        </ApplicantCardFooter>
      </ApplicantCard>,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render a card with new status', () => {
    const { container } = render(
      <ApplicantCard>
        <ApplicantCardHeader>
          <ApplicantCardTitle>Add Child</ApplicantCardTitle>
          <StatusTag status="new" />
        </ApplicantCardHeader>
        <ApplicantCardBody>
          <p>Add a new child to the application</p>
          <p className="text-sm text-gray-600">Children must be under 18 years old and dependents.</p>
        </ApplicantCardBody>
        <ApplicantCardFooter>
          <button>Add Child</button>
        </ApplicantCardFooter>
      </ApplicantCard>,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render a card without status tag', () => {
    const { container } = render(
      <ApplicantCard>
        <ApplicantCardHeader>
          <ApplicantCardTitle>Information Card</ApplicantCardTitle>
        </ApplicantCardHeader>
        <ApplicantCardBody>
          <p>This card has no status tag.</p>
          <p>Any content can go here.</p>
        </ApplicantCardBody>
        <ApplicantCardFooter>
          <span>Simple footer text</span>
        </ApplicantCardFooter>
      </ApplicantCard>,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render a card without footer', () => {
    const { container } = render(
      <ApplicantCard>
        <ApplicantCardHeader>
          <ApplicantCardTitle>Simple Card</ApplicantCardTitle>
        </ApplicantCardHeader>
        <ApplicantCardBody>
          <p>This card has no footer section.</p>
        </ApplicantCardBody>
      </ApplicantCard>,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render a card with multiple footer actions', () => {
    const { container } = render(
      <ApplicantCard>
        <ApplicantCardHeader>
          <ApplicantCardTitle>Jane Smith</ApplicantCardTitle>
          <StatusTag status="complete" />
        </ApplicantCardHeader>
        <ApplicantCardBody>
          <p>Dependent information</p>
        </ApplicantCardBody>
        <ApplicantCardFooter>
          <div className="flex justify-between">
            <button className="text-blue-600">Edit</button>
            <button className="text-red-600">Remove</button>
            <button className="text-gray-600">View Details</button>
          </div>
        </ApplicantCardFooter>
      </ApplicantCard>,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render card with custom className', () => {
    const { container } = render(
      <ApplicantCard className="custom-card">
        <ApplicantCardHeader className="custom-header">
          <ApplicantCardTitle className="custom-title">Custom Card</ApplicantCardTitle>
        </ApplicantCardHeader>
        <ApplicantCardBody className="custom-body">
          <p>Custom styled card</p>
        </ApplicantCardBody>
        <ApplicantCardFooter className="custom-footer">
          <button>Custom Action</button>
        </ApplicantCardFooter>
      </ApplicantCard>,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render individual components independently', () => {
    const { container } = render(
      <div>
        <ApplicantCardHeader>
          <ApplicantCardTitle>Independent Header</ApplicantCardTitle>
        </ApplicantCardHeader>
        <ApplicantCardBody>
          <p>Independent Body</p>
        </ApplicantCardBody>
        <ApplicantCardFooter>
          <p>Independent Footer</p>
        </ApplicantCardFooter>
      </div>,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render complex card content', () => {
    const { container } = render(
      <ApplicantCard>
        <ApplicantCardHeader>
          <ApplicantCardTitle>Complex Application Card</ApplicantCardTitle>
          <StatusTag status="new" />
        </ApplicantCardHeader>
        <ApplicantCardBody>
          <div className="space-y-4">
            <h4 className="font-semibold">Application Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium">
                  First Name
                </label>
                <p id="firstName">John</p>
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium">
                  Last Name
                </label>
                <p id="lastName">Doe</p>
              </div>
              <div>
                <label htmlFor="dob" className="block text-sm font-medium">
                  Date of Birth
                </label>
                <p id="dob">January 1, 1980</p>
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium">
                  Status
                </label>
                <p id="status">Pending Review</p>
              </div>
            </div>
            <div className="rounded border border-yellow-200 bg-yellow-50 p-3">
              <p className="text-sm text-yellow-800">Additional verification required</p>
            </div>
          </div>
        </ApplicantCardBody>
        <ApplicantCardFooter>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Last updated: 2023-12-01</span>
            <div className="space-x-2">
              <button className="rounded bg-blue-600 px-3 py-1 text-white">Edit</button>
              <button className="rounded bg-gray-600 px-3 py-1 text-white">View</button>
            </div>
          </div>
        </ApplicantCardFooter>
      </ApplicantCard>,
    );
    expect(container).toMatchSnapshot();
  });
});
