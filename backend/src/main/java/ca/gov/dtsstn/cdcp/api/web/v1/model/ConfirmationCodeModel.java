package ca.gov.dtsstn.cdcp.api.web.v1.model;

import java.time.Instant;
import java.util.Objects;

import org.springframework.core.style.ToStringCreator;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;

import ca.gov.dtsstn.cdcp.api.web.model.BaseResourceModel;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "ConfirmationCode")
@JsonPropertyOrder({ "id", "code", "expiryDate", "createdBy", "createdDate", "lastModifiedBy", "lastModifiedDate" })
public class ConfirmationCodeModel extends BaseResourceModel<ConfirmationCodeModel> {

	private String code;

	private Instant expiryDate;

	public String getCode() {
		return code;
	}

	public void setCode(String code) {
		this.code = code;
	}

	public Instant getExpiryDate() {
		return expiryDate;
	}

	public void setExpiryDate(Instant expiryDate) {
		this.expiryDate = expiryDate;
	}

	@Override
	public boolean equals(@Nullable Object obj) {
		if (this == obj) { return true; }
		if (obj == null || !super.equals(obj)) { return false; }
		if (getClass() != obj.getClass()) { return false; }

		final var other = (ConfirmationCodeModel) obj;

		return Objects.equals(code, other.code)
			&& Objects.equals(expiryDate, other.expiryDate);
	}

	@Override
	public int hashCode() {
		return Objects.hash(super.hashCode(), code, expiryDate);
	}

	@NonNull
	@Override
	public String toString() {
		return new ToStringCreator(this)
			.append("super", super.toString())
			.append("code", code)
			.append("expiryDate", expiryDate)
			.toString();
	}

}
