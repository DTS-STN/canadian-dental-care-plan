package ca.gov.dtsstn.cdcp.api.web.v1.model;
import java.util.List;
import java.util.stream.StreamSupport;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import jakarta.annotation.Nullable;
import ca.gov.dtsstn.cdcp.api.service.domain.ConfirmationCode;
@Mapper(componentModel = "spring")
public interface ConfirmationCodeModelMapper {
    
    @Nullable
	default List<ConfirmationCodeModel> toModel(@Nullable Iterable<ConfirmationCode> confirmationCodes){
        if(confirmationCodes == null) {return null;}
        return StreamSupport.stream(confirmationCodes.spliterator(),false).map(this::toModel).toList();
    }


    @Nullable
    ConfirmationCodeModel toModel(@Nullable ConfirmationCode confirmationCode);
}