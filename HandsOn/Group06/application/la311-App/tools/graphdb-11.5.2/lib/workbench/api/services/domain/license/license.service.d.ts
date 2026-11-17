import { License } from '../../../models/license';
import { Service } from '../../../providers/service/service';
/**
 * Service class for handling license-related operations.
 */
export declare class LicenseService implements Service {
    private readonly licenseRestService;
    private readonly licenseContextService;
    private readonly trackableProductTypes;
    private readonly trackableTypesOfUse;
    updateLicenseStatus(): Promise<License>;
    /**
     * Retrieves the current license information.
     *
     * This function fetches the current license data from the license REST service
     * and maps the response to a License model object.
     *
     * @returns {Promise<License>} A Promise that resolves to a License object representing the current license.
     */
    getLicense(): Promise<License>;
    /**
     * Registers a new license using the provided license code.
     *
     * This function sends the given license code to the license REST service for registration
     * and maps the response to a License model object.
     *
     * @param {string} licenseCode - The license code as a base64 encoded string to be registered.
     * @returns {Promise<License>} A Promise that resolves to a License object representing the registered license.
     */
    registerLicense(licenseCode: string): Promise<License>;
    /**
     * Unregisters the current license.
     * @returns A Promise that resolves when the license has been unregistered.
     */
    unregisterLicense(): Promise<void>;
    /**
     * Extracts license information from a given license file.
     *
     * This function uploads the provided license file to the license REST service
     * and retrieves the extracted license information in base64 format.
     * @param {File} file - The license file to be uploaded and processed.
     * @returns {Promise<string>} A Promise that resolves to a string containing the extracted license information in base64 format.
     */
    extractFromLicenseFile(file: File): Promise<string>;
    /**
     * Checks if the license is hardcoded.
     *
     * This function queries the license REST service to determine if the current license
     * is hardcoded in the system.
     *
     * @returns {Promise<boolean>} A Promise that resolves to true if the license is hardcoded, false otherwise.
     */
    getIsLicenseHardcoded(): Promise<boolean>;
    /**
     * Validates a given license code.
     *
     * This function sends the provided license code to the license REST service for validation
     * and maps the response to a License model object.
     *
     * @param {string} licenseCode - The license code as a base64 encoded string to be validated.
     * @returns {Promise<License>} A Promise that resolves to a License object representing the validated license.
     */
    validateLicense(licenseCode: string): Promise<License>;
    /**
     * Determines if the current license can be tracked.
     *
     * This function checks the product type and type of use of the current license
     * to determine if it's a trackable license. A license is considered trackable if:
     * - A license is not present, or
     * - The product type is 'free', or
     * - The product type is `sandbox`, or
     * - The type of use is `evaluation` (case-insensitive), or
     * - The type of use is `this is an evaluation license` (case-insensitive)
     *
     * @returns {boolean} True if the license is a free license, false otherwise.
     */
    isTrackableLicense(): boolean;
}
