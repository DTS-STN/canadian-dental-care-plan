package ca.gov.dtsstn.cdcp.api.data;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.hibernate.annotations.IdGeneratorType;
import org.hibernate.annotations.ValueGenerationType;

@Retention(RetentionPolicy.RUNTIME)
@IdGeneratorType(UuidGenerator.class)
@Target({ ElementType.FIELD, ElementType.METHOD })
@ValueGenerationType(generatedBy = UuidGenerator.class)
public @interface Uuid {}
