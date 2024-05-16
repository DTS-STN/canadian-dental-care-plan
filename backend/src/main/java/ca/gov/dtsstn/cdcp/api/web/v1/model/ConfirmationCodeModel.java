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
@JsonPropertyOrder({"id", "userId", "email", "confirmationCode", "codeCreatedDate",
        "codeExpiryDate", "createdBy", "createdDate", "lastModifiedBy", "lastModifiedDate"})
public class ConfirmationCodeModel extends BaseResourceModel<ConfirmationCodeModel> {

    private String userId;

    private String email;

    private String code;

    private Instant expiryDate;

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
        if (this == obj) {
            return true;
        }
        if (obj == null || !super.equals(obj)) {
            return false;
        }
        if (getClass() != obj.getClass()) {
            return false;
        }

        final var other = (ConfirmationCodeModel) obj;

        return Objects.equals(email, other.email) && Objects.equals(code, other.code)
                && Objects.equals(expiryDate, other.expiryDate)
                && Objects.equals(userId, other.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), code, email, expiryDate, userId);
    }

    @Override
    public String toString() {
        return new ToStringCreator(this).append("super", super.toString()).append("email", email)
                .append("expiryDate", expiryDate).append("cde", code).append("userId", userId)
                .toString();
    }
}
