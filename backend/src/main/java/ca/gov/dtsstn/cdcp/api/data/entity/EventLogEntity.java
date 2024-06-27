package ca.gov.dtsstn.cdcp.api.data.entity;

import java.time.Instant;

import org.immutables.builder.Builder;
import org.springframework.core.style.ToStringCreator;
import org.springframework.lang.Nullable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

@Entity(name = "EventLog")
@SuppressWarnings({ "serial" })
public class EventLogEntity extends AbstractEntity {

	public enum EventLogType {
		/* placeholder for future types */
	}

	@Column(length = 128, nullable = true, updatable = false)
	private String actor;

	@Column(length = 256, nullable = false, updatable = false)
	private String description;

	@Column(length = 65536, nullable = false, updatable = false)
	private String details;

	@Enumerated(EnumType.STRING)
	@Column(length = 32, nullable = false, updatable = false)
	private EventLogType eventType;

	@Column(length = 256, nullable = true, updatable = false)
	private String source;

	public EventLogEntity() {
		super();
	}

	@Builder.Constructor
	protected EventLogEntity(
			@Nullable Boolean isNew,
			@Nullable String id,
			@Nullable String createdBy,
			@Nullable Instant createdDate,
			@Nullable String lastModifiedBy,
			@Nullable Instant lastModifiedDate,
			@Nullable String actor,
			@Nullable String description,
			@Nullable String details,
			@Nullable EventLogType eventType,
			@Nullable String source) {
		super(isNew, id, createdBy, createdDate, lastModifiedBy, lastModifiedDate);
		this.actor = actor;
		this.description = description;
		this.details = details;
		this.eventType = eventType;
		this.source = source;
	}

	public String getActor() {
		return actor;
	}

	public void setActor(String actor) {
		this.actor = actor;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getDetails() {
		return details;
	}

	public EventLogType getEventType() {
		return eventType;
	}

	public void setEventType(EventLogType eventType) {
		this.eventType = eventType;
	}

	public void setDetails(String details) {
		this.details = details;
	}

	public String getSource() {
		return source;
	}

	public void setSource(String source) {
		this.source = source;
	}

	@Override
	public String toString() {
		return new ToStringCreator(this)
			.append("super", super.toString())
			.append("actor", actor)
			.append("description", description)
			.append("details", details)
			.append("eventType", eventType)
			.append("source", source)
			.toString();
	}

}