package ca.gov.dtsstn.cdcp.api.web.v1.model;

import java.util.List;

import org.springframework.core.style.ToStringCreator;
import org.springframework.hateoas.server.core.Relation;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;

import ca.gov.dtsstn.cdcp.api.web.model.BaseResourceModel;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "User")
@Relation(collectionRelation = "users", itemRelation = "user")
@JsonPropertyOrder({ "id", "email", "emailVerified", "userAttributes", "createdBy", "createdDate", "lastModifiedBy", "lastModifiedDate" })
public class UserModel extends BaseResourceModel<UserModel> {

	private String email;

	private Boolean emailVerified;

	private List<UserAttributeModel> userAttributes;

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public Boolean getEmailVerified() {
		return emailVerified;
	}

	public void setEmailVerified(Boolean emailVerified) {
		this.emailVerified = emailVerified;
	}

	public List<UserAttributeModel> getUserAttributes() {
		return userAttributes;
	}

	public void setUserAttributes(List<UserAttributeModel> userAttributes) {
		this.userAttributes = userAttributes;
	}

	@Override
	public String toString() {
		return new ToStringCreator(this)
			.append("super", super.toString())
			.append("email", email)
			.append("emailVerified", emailVerified)
			.append("userAttributes", userAttributes)
			.toString();
	}

}
