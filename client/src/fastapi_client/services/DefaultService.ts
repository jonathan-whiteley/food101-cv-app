/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Body_classify_image_api_classify_post } from '../models/Body_classify_image_api_classify_post';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * Classify Image
     * Classify uploaded food image.
     *
     * Args:
     * image: Uploaded image file (JPG/PNG)
     *
     * Returns:
     * Classification results with prediction set
     * @param formData
     * @returns any Successful Response
     * @throws ApiError
     */
    public static classifyImageApiClassifyPost(
        formData: Body_classify_image_api_classify_post,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/classify',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Health
     * Health check endpoint.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static healthHealthGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health',
        });
    }
}
