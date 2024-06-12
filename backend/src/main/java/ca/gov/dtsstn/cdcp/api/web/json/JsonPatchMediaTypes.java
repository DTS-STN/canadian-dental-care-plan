package ca.gov.dtsstn.cdcp.api.web.json;

import org.springframework.http.MediaType;

public class JsonPatchMediaTypes {

	public static final String JSON_MERGE_PATCH_VALUE = "application/merge-patch+json";

	public static final MediaType JSON_MERGE_PATCH = MediaType.valueOf(JSON_MERGE_PATCH_VALUE);

	public static final String JSON_PATCH_VALUE = "application/json-patch+json";

	public static final MediaType JSON_PATCH = MediaType.valueOf(JSON_PATCH_VALUE);

}
