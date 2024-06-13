package ca.gov.dtsstn.cdcp.api.web.v1.model.mapper;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;
import org.mapstruct.AfterMapping;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import ca.gov.dtsstn.cdcp.api.service.domain.User;
import ca.gov.dtsstn.cdcp.api.web.v1.controller.ConfirmationCodesController;
import ca.gov.dtsstn.cdcp.api.web.v1.controller.EmailValidationsController;
import ca.gov.dtsstn.cdcp.api.web.v1.controller.SubscriptionsController;
import ca.gov.dtsstn.cdcp.api.web.v1.controller.UsersController;
import ca.gov.dtsstn.cdcp.api.web.v1.model.UserCreateModel;
import ca.gov.dtsstn.cdcp.api.web.v1.model.UserModel;
import ca.gov.dtsstn.cdcp.api.web.v1.model.UserPatchModel;
import jakarta.annotation.Nullable;

@Mapper
public interface UserModelMapper {

	@Nullable
	UserModel toModel(@Nullable User user);

	@AfterMapping
	default UserModel afterMappingToModel(@MappingTarget UserModel user) {
		return user.add(linkTo(methodOn(UsersController.class).getUserById(user.getId())).withSelfRel())
			.add(linkTo(methodOn(SubscriptionsController.class).getSubscriptionsByUserId(user.getId())).withRel("subscriptions"))
			.add(linkTo(methodOn(EmailValidationsController.class).getEmailValidationByUserId(user.getId())).withRel("emailValidations"))
			.add(linkTo(methodOn(ConfirmationCodesController.class).getConfirmationCodesByUserId(user.getId())).withRel("confirmationCodes"));
	}


	@Nullable	
	UserPatchModel toPatchModel(@Nullable User user);

	@Nullable
	@Mapping(target = "email", ignore = false)
	@BeanMapping(ignoreByDefault = true, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
	User toDomain(@Nullable UserPatchModel userModel);	

	@Mapping(target = "id", ignore = true)
	@Mapping(target = "createdBy", ignore = true)
	@Mapping(target = "createdDate", ignore = true)
	@Mapping(target = "lastModifiedBy", ignore = true)
	@Mapping(target = "lastModifiedDate", ignore = true)
	@Nullable
	User toDomain(@Nullable UserCreateModel userCreateModel);

}
