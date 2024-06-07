package ca.gov.dtsstn.cdcp.api.web.v1.model.mapper;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

import ca.gov.dtsstn.cdcp.api.service.domain.User;
import ca.gov.dtsstn.cdcp.api.web.v1.controller.EmailValidationsController;
import ca.gov.dtsstn.cdcp.api.web.v1.controller.SubscriptionsController;
import ca.gov.dtsstn.cdcp.api.web.v1.controller.UsersController;
import ca.gov.dtsstn.cdcp.api.web.v1.model.UserModel;
import jakarta.annotation.Nullable;

@Mapper
public interface UserModelMapper {

	@Nullable
	UserModel toModel(@Nullable User user);

	@AfterMapping
	default UserModel afterMappingToModel(@MappingTarget UserModel user) {
		return user.add(linkTo(methodOn(UsersController.class).getUserById(user.getId())).withSelfRel())
			.add(linkTo(methodOn(SubscriptionsController.class).getSubscriptionsByUserId(user.getId())).withRel("subscriptions"))
			.add(linkTo(methodOn(EmailValidationsController.class).getEmailValidationByUserId(user.getId())).withRel("emailValidations"));
	}

}
