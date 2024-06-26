package ca.gov.dtsstn.cdcp.api.data.entity;

import java.time.Instant;

import org.immutables.builder.Builder;
import org.springframework.core.style.ToStringCreator;

import jakarta.annotation.Nullable;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;

@SuppressWarnings({ "serial" })
@Entity(name = "ConfirmationCode")
public class ConfirmationCodeEntity extends AbstractEntity {

	@Column(length = 8, nullable = false)
	private String code;

	@Column(nullable = false)
	private Instant expiryDate;

	public ConfirmationCodeEntity() {
		super();
	}

	@Builder.Constructor
	protected ConfirmationCodeEntity(
			@Nullable Boolean isNew,
			@Nullable String id,
			@Nullable String createdBy,
			@Nullable Instant createdDate,
			@Nullable String lastModifiedBy,
			@Nullable Instant lastModifiedDate,
			@Nullable String code,
			@Nullable Instant expiryDate) {
		super(isNew, id, createdBy, createdDate, lastModifiedBy, lastModifiedDate);
		this.code = code;
		this.expiryDate = expiryDate;
	}

	public String getCode() {
		return code;
	}

	public void setCode(String confirmationCode) {
		this.code = confirmationCode;
	}

	public Instant getExpiryDate() {
		return expiryDate;
	}

	public void setExpiryDate(Instant expiryDate) {
		this.expiryDate = expiryDate;
	}

	@Override
	public String toString() {
		return new ToStringCreator(this)
			.append("super", super.toString())
			.append("code", code)
			.append("expriryDate", expiryDate)
			.toString();
	}

}
