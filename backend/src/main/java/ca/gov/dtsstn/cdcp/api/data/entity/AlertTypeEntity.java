package ca.gov.dtsstn.cdcp.api.data.entity;

import java.time.Instant;

import org.immutables.builder.Builder;
import org.springframework.core.style.ToStringCreator;
import org.springframework.lang.Nullable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;

@Entity(name = "AlertType")
@SuppressWarnings({ "serial" })
public class AlertTypeEntity extends AbstractEntity {

	@Column(length = 16, nullable = false)
	private String code;

	@Column(length = 256)
	private String description;

	public AlertTypeEntity() {
		super();
	}

	@Builder.Constructor
	protected AlertTypeEntity(
			@Nullable Boolean isNew,
			@Nullable String id,
			@Nullable String createdBy,
			@Nullable Instant createdDate,
			@Nullable String lastModifiedBy,
			@Nullable Instant lastModifiedDate,
			@Nullable String code,
			@Nullable String description) {
		super(isNew, id, createdBy, createdDate, lastModifiedBy, lastModifiedDate);
		this.code = code;
		this.description = description;
	}

	public String getCode() {
		return this.code;
	}

	public void setCode(String code) {
		this.code = code;
	}

	public String getDescription() {
		return this.description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	@Override
	public String toString() {
		return new ToStringCreator(this)
			.append("super", super.toString())
			.append("code", code)
			.append("description", description)
			.toString();
	}

}
