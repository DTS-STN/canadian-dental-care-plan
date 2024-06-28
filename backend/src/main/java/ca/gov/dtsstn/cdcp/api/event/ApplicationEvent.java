package ca.gov.dtsstn.cdcp.api.event;

import java.time.Instant;

import jakarta.annotation.Nullable;

/**
 * Represents an event that occurs within the application.
 *
 * @param <T> The type of the event payload.
 */
public interface ApplicationEvent<T> {

	/**
	 * The actor (typically a user) who triggered the event.
	 * Can be {@code null}.
	 */
	@Nullable String getActor();

	/**
	 * A description of the event.
	 * Can be {@code null}.
	 */
	@Nullable String getDescription();

	/**
	 * The type of event.
	 */
	String getEventType();

	/**
	 * The event payload.
	 * Can be {@code null}.
	 */
	@Nullable T getPayload();

	/**
	 * The object from which the event was triggered.
	 */
	String getSource();

	/**
	 * System time when the event happened.
	 */
	default Instant getTimestamp() {
		return Instant.now();
	}

}
