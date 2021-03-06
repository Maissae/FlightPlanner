import React, { useState } from 'react';
import { FlatList, TextInput, View, Text, TouchableOpacity } from 'react-native';
import { Form, Field, ErrorMessage, Formik, FieldArray } from 'formik';
import FlightPlanValidationSchema from './CustomFlightPlanFormValidation';
import { styles, formStyles } from '../../../styles/Styles';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import NodeFormContainer from './NodeFormContainer';
import { FlightPlan, Node } from '../../../models/FlightPlan';
import { v4 as uuidv4 } from 'uuid';
import * as flightPlanStore from '../../../stores/flightPlansStore';
import { StackActions } from '@react-navigation/native';

export interface Props {
  flightPlan: FlightPlan | null,
  navigation: any
}

export const CustomFlightPlanForm = (props: Props) => {
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isNodeModalVisible, setNodeModalVisiblity] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodes, setNodes] = useState<Node[]>(props.flightPlan?.nodes ?? []);
  const [isInitializing, setIsInitializing] = useState(true);

  const initialValues = {
    name: props.flightPlan !== null ? props.flightPlan.name : '',
    date: props.flightPlan !== null ? new Date(props.flightPlan.date) : new Date(),
    description: props.flightPlan !== null ? props.flightPlan.description : '',
    nodes: nodes
  };

  if(props.flightPlan !== null && props.flightPlan?.nodes !== null && props.flightPlan?.nodes.length !== 0 && nodes.length === 0 && isInitializing) {
    setIsInitializing(false);
    setNodes(props.flightPlan?.nodes ?? []);
  }

  const renderItemButton = ({ item }: { item: Node }) => {
    return (
      <View style={formStyles.formHorizontalSelection}>
        <TouchableOpacity activeOpacity={0.5} style={{...styles.touchableOpacity, flex: 5}} onPress={() => {
          setSelectedNode(item);
          setNodeModalVisiblity(true);
        }}>
          <Text>{item.ident} {item.name !== null && item.name !== undefined ? `- ${item.name}` : ''} @ {item.altitude} ft</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.5} style={formStyles.formHorizontalSelectionButton} onPress={() => {
          setNodes(nodes.filter((element) => element.id !== item.id));
        }}>
          <Text>Delete</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={FlightPlanValidationSchema}
      enableReinitialize={true}
      onSubmit={async (values) => {
        if(!!props.flightPlan) {
          props.flightPlan.name = values.name;
          props.flightPlan.description = values.description;
          props.flightPlan.date = values.date;
          props.flightPlan.nodes = values.nodes;
          await flightPlanStore.updateFlightPlan(props.flightPlan)
        } else {
          await flightPlanStore.addFlightPlan(new FlightPlan(values.name, values.date, values.description, values.nodes));
        }
        const popAction = StackActions.pop(1);
        props.navigation.dispatch(popAction);
      }}
    >
      {({ handleChange, handleBlur, handleSubmit, setFieldValue, errors, touched, values }) => (
        <View style={formStyles.formContainer}>
          <TextInput
            onChangeText={handleChange('name')}
            onBlur={handleBlur('name')}
            value={values.name}
            style={formStyles.inputText}
            placeholder='Flight plan name'
            maxLength={100}
          />
          {touched.name && errors.name ? <Text style={formStyles.validationError}>{errors.name}</Text> : null}

          <TextInput
            onChangeText={handleChange('description')}
            onBlur={handleBlur('description')}
            value={values.description}
            style={{ ...formStyles.inputText, textAlignVertical: 'top' }}
            placeholder='Description (optional)'
            maxLength={1000}
            multiline={true}
            numberOfLines={4}
          />
          {touched.description && errors.description ? <Text style={formStyles.validationError}>{errors.description}</Text> : null}

          <Text style={formStyles.formDateText} onPress={() => setDatePickerVisibility(true)}>{values.date.toString()}</Text>
          <DateTimePickerModal
            mode='datetime'
            date={new Date(values.date)}
            isVisible={isDatePickerVisible}
            onConfirm={(date) => {
              setFieldValue('date', date);
              setDatePickerVisibility(false);
            }}
            onCancel={() => setDatePickerVisibility(false)}
          />
          <TouchableOpacity activeOpacity={0.8} style={formStyles.formButton} onPress={() => setNodeModalVisiblity(true)}>
            <Text style={formStyles.formButtonText}>Add steerpoint</Text>
          </TouchableOpacity>
          <NodeFormContainer
            selectedNode={selectedNode}
            isVisible={isNodeModalVisible}
            onConfirm={(selectedNode: Node | null, node: Node) => {
              let index = -1;
              if(selectedNode !== null) {
                index = values.nodes.findIndex((element) => element.id === selectedNode?.id);
              }
              
              if(index === -1) {
                values.nodes.push(node);
              } else {
                values.nodes[index] = node;
              }
              setSelectedNode(null);
              setNodeModalVisiblity(false);
            }}
            onCancel={() => {
              setSelectedNode(null);
              setNodeModalVisiblity(false)
            }}
          />
          {touched.date && errors.date ? <Text style={formStyles.validationError}>{errors.date}</Text> : null}

          <FlatList
            data={values.nodes}
            renderItem={renderItemButton}
            keyExtractor={(item: Node) => item.id}
          />

          <TouchableOpacity activeOpacity={0.8} style={formStyles.formButton} onPress={handleSubmit}>
            <Text style={formStyles.formButtonText}>{props.flightPlan !== null ? 'Update flight plan' : 'Create flight plan'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </Formik>
  );
}