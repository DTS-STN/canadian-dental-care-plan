package ca.gov.dtsstn.cdcp.api.web.v1.model;
import java.time.Instant;

import java.util.Objects;

import org.springframework.core.style.ToStringCreator;
import org.springframework.hateoas.server.core.Relation;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;

import ca.gov.dtsstn.cdcp.api.web.model.BaseResourceModel;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.annotation.Nullable;
@Schema(name = "ConfirmationCode")
@Relation(collectionRelation = "confirmationCodes", itemRelation = "confirmationCode")
@JsonPropertyOrder({ "id", "userId","email", "confirmationCode", "codeCreatedDate", "codeExpiryDate", "createdBy", "createdDate", "lastModifiedBy", "lastModifiedDate" })
public class ConfirmationCodeModel extends BaseResourceModel<ConfirmationCodeModel>{
    
    private String userId;

	private String email;

	private String confirmationCode;

	private Instant codeCreatedDate;

    private Instant codeExpiryDate;

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getConfirmationCode() {
        return confirmationCode;
    }

    public void setConfirmationCode(String confirmationCode) {
        this.confirmationCode = confirmationCode;
    }

    public Instant getCodeCreatedDate() {
        return codeCreatedDate;
    }

    public void setCodeCreatedDate(Instant codeCreatedDate) {
        this.codeCreatedDate = codeCreatedDate;
    }

    public Instant getCodeExpiryDate() {
        return codeExpiryDate;
    }

    public void setCodeExpiryDate(Instant codeExpiryDate) {
        this.codeExpiryDate = codeExpiryDate;
    }

    @Override
	public boolean equals(@Nullable Object obj) {
		if (this == obj) { return true; }
		if (obj == null || !super.equals(obj)) { return false; }
		if (getClass() != obj.getClass()) { return false; }

		final var other = (ConfirmationCodeModel) obj;

		return Objects.equals(email, other.email)
            && Objects.equals(confirmationCode, other.confirmationCode)
            && Objects.equals(codeCreatedDate, other.codeCreatedDate)
            && Objects.equals(codeExpiryDate, other.codeExpiryDate)
			&& Objects.equals(userId, other.userId);
	}

    @Override
	public int hashCode() {
		return Objects.hash(
			super.hashCode(),
			confirmationCode,
			email,
			codeCreatedDate,
			codeExpiryDate,
			userId);
	}

    @Override
	public String toString() {
		return new ToStringCreator(this)
			.append("super", super.toString())
			.append("email", email)
			.append("codeExpiryDate", codeExpiryDate)
			.append("codeCreatedDate", codeCreatedDate)
			.append("confirmationCode", confirmationCode)
			.append("userId", userId)
			.toString();
	}
}
