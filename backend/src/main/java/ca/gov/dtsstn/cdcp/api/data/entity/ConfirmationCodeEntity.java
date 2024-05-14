package ca.gov.dtsstn.cdcp.api.data.entity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import java.time.Instant;
import org.immutables.builder.Builder;
import org.springframework.core.style.ToStringCreator;
import org.springframework.lang.Nullable;
@Entity(name = "ConfirmationCode")
@SuppressWarnings({ "serial" })
public class ConfirmationCodeEntity extends AbstractEntity {
    
    @Column(length = 9, nullable = false, updatable = false)
	private String userId;

	@Column(length = 50, nullable = false)
	private String email;

    @Column(length = 50, nullable = false)
	private String confirmationCode;

    @Column(length = 50, nullable = false)
	private Instant codeCreatedDate;

    @Column(length = 50, nullable = false)
	private Instant codeExpiryDate;
    
    
    public ConfirmationCodeEntity() {
		super();
	}

    @Builder.Constructor
	protected ConfirmationCodeEntity(
        @Nullable String id,
        @Nullable String createdBy,
        @Nullable Instant createdDate,
        @Nullable String lastModifiedBy,
        @Nullable Instant lastModifiedDate,
        @Nullable Boolean isNew,
        @Nullable String userId,
        @Nullable String email,
        @Nullable String confirmationCode,
        @Nullable Instant codeCreatedDate,
        @Nullable Instant codeExpiryDate )
        {
            super(id, createdBy, createdDate, lastModifiedBy, lastModifiedDate, isNew);
            this.userId = userId;
            this.email = email;
            this.confirmationCode = confirmationCode;
            this.codeCreatedDate = codeCreatedDate;
            this.codeExpiryDate = codeExpiryDate;
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
	public String toString() {
		return new ToStringCreator(this)
			.append("super", super.toString())
			.append("userId", userId)
			.append("email", email)
			.append("confirmationCode", confirmationCode)
            .append("codeCreatedDate", codeCreatedDate)
            .append("codeExpriryDate", codeExpiryDate)
			.toString();
	}
}