import { AZURE_NAME, CLOUD_METER_APP_NAME } from './constants';

const isSourceAzureRHEL = ({ source, sourceTypes, appTypes }) => {
  const azureType = sourceTypes?.find(({ name }) => name === AZURE_NAME);
  const rhelApp = appTypes?.find(({ name }) => name === CLOUD_METER_APP_NAME);

  return (
    azureType &&
    rhelApp &&
    source.source_type_id === azureType.id &&
    source.applications?.length === 1 &&
    source.applications[0].application_type_id === rhelApp.id
  );
};

export default isSourceAzureRHEL;
