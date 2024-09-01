import React, { useState } from 'react';
import { validator } from './validator';
import PubSub from 'pubsub-js';
import {
    FORM_SUBMIT,
    FORM_VALIDATED
  } from '../../../../src/lib/util/events';
import { get } from '../../../../src/lib/util/get';
import Button from './Button';
import PropTypes from 'prop-types';
export const FormContext = React.createContext();
export const FormDispatch = React.createContext();

export function Form(props) {
    const {
        id,
        action,
        method,
        isJSON = true,
        onStart,
        onComplete,
        onError,
        onSuccess,
        onValidationError,
        children,
        submitBtn = true,
        btnText,
        dataFilter
    } = props;

    const [fields, setFields] = React.useState([]);
    const formRef = React.useRef();
    const [loading, setLoading] = useState(false);
    const [state, setState] = useState('initialized');

    const addField = (name, value, validationRules) => {
        setFields((previous) => {
            previous.concat({ name, value, validationRules, updated: false }); 
        })
    }

    const updateField = (name, value, validationRules) => {
        setFields((previous) => {
            previous.map((field)=>{
                if(field.name === name){
                    return {name, value, validationRules, updated: true}
                }
                return field
            })
        })
    } 

    const removeField = (name) => {
        setFields((previous) => {
            return previous.filter((field) => field.name !== name)
        })
    }

    const validate = () => {
        const errors = {}
        fields.forEach((f) => {
            f.validationRules.forEach((r) => {
                let rule;
                if(typeof r === 'string'){
                    rule = r
                } else {
                    rule = r.rule
                }

                const ruleValidator = validator.getRule(rule);
                if(ruleValidator === undefined) return;
                if(!ruleValidator.handler.call(fields, f.value)){
                    if (r.message) {
                        errors[f.name] = r.message;
                    } else {
                        errors[f.name] = ruleValidator.errorMessage;
                    }
                }
            })
        })

        if(Object.keys(errors).length === 0){
            setFields(fields.map((f) => {
                return {...f, error: undefined}
            }))
        } else {
            setFields(fields.map((f) => {
                if(!errors[f.name]){
                    return {...f, error: undefined}
                } else {
                    return {...f, error: errors[f.name]}
                }
            }))
        }
        return errors;
    }

    const submit = async (e) => {
        e.preventDefault();
        setState('submitting');
        try {
            PubSub.publishSync(FORM_SUBMIT, { props });
            const errors = validate();
            PubSub.publishSync(FORM_VALIDATED, { formId: id, errors });
            if(Object.keys(errors).length === 0){
                const formData = new FormData(document.getElementById(id))
                setLoading(true);
                if(onStart){
                    await onStart();
                }
                const response = await fetch(
                    action,
                    {
                        method,
                        body: 
                            isJSON === true 
                                ? JSON.stringify(serializeForm(formData.entries(), dataFilter))
                                : formData,
                        header: {
                            'X-Requested-With': 'XMLHttpRequest',
                            ...(isJSON === true ? { 'Content-Type': 'application/json' } : {})
                        }
                    }
                )
                if (
                    !response.headers.get('content-type') ||
                    !response.headers.get('content-type').includes('application/json')
                  ) {
                    throw new TypeError('Something wrong. Please try again');
                }

                const responseJson = await response.json();
                if (get(responseJson, 'data.redirectUrl') !== undefined) {
                    window.location.href = responseJson.data.redirectUrl;
                    return true;
                }
                if (onSuccess) {
                    await onSuccess(responseJson);
                }
                setState('submitSuccess');
            } else {
                setState('validateFailed');
                if (onValidationError) {
                    await onValidationError();
                }
                const firstFieldWithError = Object.keys(errors)[0];
                const firstElementWithError = document.getElementsByName(firstFieldWithError)[0];
                if(firstElementWithError){
                    firstElementWithError.focus();
                }
            }
        } catch (error) {
            setState('submitFailed');
            if(onError){
                await onError();
            }
            throw error;
        } finally {
            setLoading(false);
            setState('submitted');
            if (onComplete) {
                await onComplete();
            }
        }
        return true;
    }

    return (
        <FormContext.Provider
            value={{
                fields,
                addField,
                updateField,
                removeField,
                state,
                ...props
            }}>
            <FormDispatch.Provider
                value={{
                    submit,
                    validate
                }}
            >
                <form
                 ref={formRef}
                 id={id}
                 action={action}
                 method={method}
                 onSubmit={(e) => submit(e)}
                >
                    {children}
                    {submitBtn === true && (
                        <div className="form-submit-button flex border-t border-divider mt-4 pt-4">
                            <Button
                                title={btnText || 'Save'}
                                onAction={() => {
                                    document.getElementById(id).dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                                }}
                                isLoading={loading}
                                type="submit"
                            ></Button>
                        </div>
                    )}
                </form>
            </FormDispatch.Provider>
        </FormContext.Provider>
    )
}

Form.TypeProps = {
    action: PropTypes.string,
    btnText: PropTypes.string,
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node
    ]).isRequired,
    id: PropTypes.string.isRequired,
    method: PropTypes.string,
    onComplete: PropTypes.func,
    onError: PropTypes.func,
    onStart: PropTypes.func,
    onSuccess: PropTypes.func,
    onValidationError: PropTypes.func,
    submitBtn: PropTypes.bool,
    isJSON: PropTypes.bool,
    dataFilter: PropTypes.func
}

Form.defaultProps = {
    btnText: undefined,
    onComplete: undefined,
    onError: undefined,
    onStart: undefined,
    onSuccess: undefined,
    onValidationError: undefined,
    submitBtn: true,
    isJSON: true,
    action: '',
    method: 'POST',
    dataFilter: undefined
};

export const useFormContext = () => React.useContext(FormContext);
export const useFormDispatch = () => React.useContext(FormDispatch);