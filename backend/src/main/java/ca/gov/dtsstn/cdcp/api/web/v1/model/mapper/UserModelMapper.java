package ca.gov.dtsstn.cdcp.api.web.v1.model.mapper;

import org.mapstruct.Mapper;

import ca.gov.dtsstn.cdcp.api.service.domain.User;
import ca.gov.dtsstn.cdcp.api.web.v1.model.UserModel;
import jakarta.annotation.Nullable;

@Mapper
public interface UserModelMapper {

	@Nullable
	UserModel map(@Nullable User user);

}
