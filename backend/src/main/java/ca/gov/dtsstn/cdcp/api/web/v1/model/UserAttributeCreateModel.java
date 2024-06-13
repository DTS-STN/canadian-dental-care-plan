package ca.gov.dtsstn.cdcp.api.web.v1.model;

import org.springframework.core.style.ToStringCreator;
import org.springframework.hateoas.server.core.Relation;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;


@Schema(name = "userAttribute")
@Relation(collectionRelation = "userAttributes", itemRelation = "userAttribute")
@JsonPropertyOrder({ "id", "name", "value", "createdBy", "createdDate", "lastModifiedBy", "lastModifiedDate" })
public class UserAttributeCreateModel {
	
	private String name;

	private String value;

	@NotBlank
	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	@NotBlank
	public String getValue() {
		return value;
	}


	public void setValue(String value) {
		this.value = value;
	}


	@Override
	public String toString() {
		return new ToStringCreator(this)
			.append("super", super.toString())
			.append("name", name)
			.append("value", value)
			.toString();
	}
}
