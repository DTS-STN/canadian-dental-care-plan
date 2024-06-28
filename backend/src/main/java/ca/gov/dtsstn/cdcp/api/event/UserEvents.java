package ca.gov.dtsstn.cdcp.api.event;

import org.immutables.value.Value.Immutable;

import ca.gov.dtsstn.cdcp.api.service.domain.User;

/**
 * Generic CRUD events for {@link User} interactions.
 */
public final class UserEvents {

	private UserEvents() {
		/* utility class */
	}

	@Immutable
	public interface UserCreatedEvent extends ApplicationEvent<User> {

		static ImmutableUserCreatedEvent.Builder builder() {
			return ImmutableUserCreatedEvent.builder();
		}

		@Override
		default String getEventType() {
			return "USER_CREATED";
		}

	}

	@Immutable
	public interface UserReadEvent extends ApplicationEvent<User> {

		static ImmutableUserReadEvent.Builder builder() {
			return ImmutableUserReadEvent.builder();
		}

		@Override
		default String getEventType() {
			return "USER_READ";
		}

	}

	@Immutable
	public interface UserUpdatedEvent extends ApplicationEvent<User> {

		static ImmutableUserUpdatedEvent.Builder builder() {
			return ImmutableUserUpdatedEvent.builder();
		}

		@Override
		default String getEventType() {
			return "USER_UPDATED";
		}

	}

	@Immutable
	public interface UserDeletedEvent extends ApplicationEvent<User> {

		static ImmutableUserDeletedEvent.Builder builder() {
			return ImmutableUserDeletedEvent.builder();
		}

		@Override
		default String getEventType() {
			return "USER_DELETED";
		}

	}

}
