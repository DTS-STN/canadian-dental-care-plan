package ca.gov.dtsstn.cdcp.api.web.model;

import java.time.Instant;
import java.util.Objects;

import org.springframework.core.style.ToStringCreator;
import org.springframework.hateoas.RepresentationModel;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * A HATEOAS base model containing fields common to all resources.
 */
public class BaseResourceModel<T extends BaseResourceModel<? extends T>> extends RepresentationModel<T> {

	@Schema(description = "The internal unique ID of the resource.", example = "00000000-0000-0000-0000-000000000000")
	protected String id;

	@Schema(description = "The creator of the resource.", example = "Canadian Dental Care Plan API")
	protected String createdBy;

	@Schema(description = "The creation timestamp of the resource in ISO-8601 format.", example = "2000-01-01T00:00:00.000Z")
	protected Instant createdDate;

	@Schema(description = "The last modifier of the resource.", example = "Canadian Dental Care Plan API")
	protected String lastModifiedBy;

	@Schema(description = "The last modification timestamp of the resource in ISO-8601 format.", example = "2000-01-01T00:00:00.000Z")
	protected Instant lastModifiedDate;

	@Nullable
	public String getId() {
		return id;
	}

	public void setId(@Nullable String id) {
		this.id = id;
	}

	@Nullable
	public String getCreatedBy() {
		return createdBy;
	}

	public void setCreatedBy(@Nullable String createdBy) {
		this.createdBy = createdBy;
	}

	@Nullable
	public Instant getCreatedDate() {
		return createdDate;
	}

	public void setCreatedDate(@Nullable Instant createdDate) {
		this.createdDate = createdDate;
	}

	@Nullable
	public String getLastModifiedBy() {
		return lastModifiedBy;
	}

	public void setLastModifiedBy(@Nullable String lastModifiedBy) {
		this.lastModifiedBy = lastModifiedBy;
	}

	@Nullable
	public Instant getLastModifiedDate() {
		return lastModifiedDate;
	}

	public void setLastModifiedDate(@Nullable Instant lastModifiedDate) {
		this.lastModifiedDate = lastModifiedDate;
	}

	@Override
	public boolean equals(@Nullable Object obj) {
		if (this == obj) { return true; }
		if (obj == null || !super.equals(obj)) { return false; }
		if (getClass() != obj.getClass()) { return false; }

		final BaseResourceModel<?> other = (BaseResourceModel<?>) obj;

		return Objects.equals(this.id, other.id)
			&& Objects.equals(this.createdBy, other.createdBy)
			&& Objects.equals(this.createdDate, other.createdDate)
			&& Objects.equals(this.lastModifiedBy, other.lastModifiedBy)
			&& Objects.equals(this.lastModifiedDate, other.lastModifiedDate);
	}

	@Override
	public int hashCode() {
		return Objects.hash(super.hashCode(), id, createdBy, createdDate, lastModifiedBy, lastModifiedDate);
	}

	@NonNull
	@Override
	public String toString() {
		return new ToStringCreator(this)
			.append("id", id)
			.append("createdBy", createdBy)
			.append("createdDate", createdDate)
			.append("lastModifiedBy", lastModifiedBy)
			.append("lastModifiedDate", lastModifiedDate)
			.toString();
	}

}
