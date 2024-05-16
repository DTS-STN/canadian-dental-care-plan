package ca.gov.dtsstn.cdcp.api.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import java.time.Instant;
import org.immutables.builder.Builder;
import org.springframework.core.style.ToStringCreator;
import jakarta.annotation.Nullable;

@Entity(name = "ConfirmationCode")
@SuppressWarnings({"serial"})
public class ConfirmationCodeEntity extends AbstractEntity {

    @Column(length = 9, nullable = false, updatable = false)
    private String userId;

    @Column(length = 50, nullable = false)
    private String email;

    @Column(length = 10, nullable = false)
    private String code;

    @Column(nullable = false)
    private Instant expiryDate;


    public ConfirmationCodeEntity() {
        super();
    }

    @Builder.Constructor
    protected ConfirmationCodeEntity(@Nullable String id, @Nullable String createdBy,
            @Nullable Instant createdDate, @Nullable String lastModifiedBy,
            @Nullable Instant lastModifiedDate, @Nullable Boolean isNew, @Nullable String userId,
            @Nullable String email, @Nullable String code, @Nullable Instant codeCreatedDate,
            @Nullable Instant expiryDate) {
        super(id, createdBy, createdDate, lastModifiedBy, lastModifiedDate, isNew);
        this.userId = userId;
        this.email = email;
        this.code = code;
        this.expiryDate = expiryDate;
    }

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
        return new ToStringCreator(this).append("super", super.toString()).append("userId", userId)
                .append("email", email).append("code", code).append("expriryDate", expiryDate)
                .toString();
    }
}
