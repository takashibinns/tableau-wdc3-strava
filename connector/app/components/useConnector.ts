import { useEffect, useState } from 'react'
import Connector, { HandlerInput, Logger, OAuthCredentials } from '@tableau/taco-toolkit'

type ConnectorState = {
  handlerInputs: HandlerInput[]
  oauthCredentials: OAuthCredentials | null
  errorMessage?: string
  isSubmitting: boolean
  isInitializing: boolean
}

const useConnector = () => {
  const [connector, setConnector] = useState<Connector | null>(null)

  const [connectorState, setConnectorState] = useState<ConnectorState>({
    handlerInputs: [],
    isInitializing: true,
    isSubmitting: false,
    oauthCredentials: null,
    errorMessage: '',
  })

  const onInitializedSuccess = (connector: Connector) => {
    let oauthCredentials = connector.oAuthCredentials
    setConnectorState({ ...connectorState, oauthCredentials, isInitializing: false })
  }

  const onInitializedFailure = (_: Connector, error: Error) => {
    Logger.error(`Connector Initialized Error: ${error.message}`)
    setConnectorState({ ...connectorState, errorMessage: error.message, isInitializing: false })
  }

  const setSecrets = () => {
    if (!connector) {
      return
    }
    const { oauthCredentials } = connectorState

    if (!oauthCredentials) {
      connector.secrets = {}
      return
    }

    connector.secrets = {
      accessToken: oauthCredentials?.accessToken,
      refreshToken: oauthCredentials?.refreshToken,
    }
  }

  const submit = () => {
    Logger.info(`submit function starting`)
    if (!connector) {
      return
    }

    try {
      //setSecrets()
      connector.handlerInputs = connectorState.handlerInputs
      connector.submit()
    } catch (error) {
      setConnectorState({ ...connectorState, errorMessage: error.message, isSubmitting: false })
    }
  }

  const handleSubmit = (handlerInputs: HandlerInput[]) => {
    setConnectorState({ ...connectorState, isSubmitting: true, handlerInputs })
  }

  useEffect(() => {
    if (connectorState.isSubmitting) {
      submit()
    }
  }, [connectorState.isSubmitting])

  useEffect(() => {
    const connector = new Connector(onInitializedSuccess, onInitializedFailure)
    setConnector(connector)
  }, [])

  return {
    isAuthenticated: !!connectorState.oauthCredentials?.accessToken,
    ...connectorState,
    handleSubmit,
  }
}

export default useConnector
