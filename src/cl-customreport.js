define([
        'jquery',
        'underscore',
        'qlik',
        'ng!$q',
        'ng!$http',
        './properties',
        './initialproperties',
        'client.utils/state',
        './lib/js/extensionUtils',
        './lib/external/Sortable/Sortable',
        'text!./lib/css/style.css',
        'text!./lib/partials/customreport.ng.html',
    ],
    function($, _, qlik, $q, $http, props, initProps, stateUtil, extensionUtils, sortable, cssContent, ngTemplate) {
        'use strict';

        extensionUtils.addStyleToHeader(cssContent);

        return {

            definition: props,
            initialProperties: initProps,
            snapshot: {
                canTakeSnapshot: false
            },

            resize: function($element, layout) {

                this.$scope.size.clientHeight = $element.context.clientHeight;
                this.$scope.size.clientWidth = $element.context.clientWidth;
                
                this.$scope.handleResize($element,layout.props.allowCollapse);

            },

            paint: function($element, layout) {

                this.$scope.size.clientHeight = $element.context.clientHeight;
                this.$scope.size.clientWidth = $element.context.clientWidth;
                
                if (this.$scope.firstPaint) {
                    this.$scope.firstPaint = false;
                    console.log('firstPaint', layout);
                    this.$scope.fieldsAndSortbarVisible = layout.props.showFieldsAndSortbar;                    
                }
                this.$scope.handleResize($element,layout.props.allowCollapse); 
                
               
            },

            getExportRawDataOptions: function(a, c, e) {
                c.getVisualization().then(function(visualization) {
                    if (!$('#cl-customreport-container').scope().collapsed) {
                        if ($('#cl-customreport-container').scope().fieldsAndSortbarVisible) {                            
                            a.addItem({
                                translation: "Hide fields/sortbar",
                                tid: "Expand",
                                icon: "icon-maximize",
                                select: function() {
                                    console.log($('#cl-customreport-container').scope());
                                    $('#cl-customreport-container').scope().hideFieldAndSortbar();
                                }
                            });

                        } else {
                            a.addItem({
                                translation: "Show fields/sortbar",
                                tid: "Collapse",
                                icon: "icon-minimize",
                                select: function() {
                                    console.log($('#cl-customreport-container').scope());
                                    $('#cl-customreport-container').scope().showFieldAndSortbar();
                                }
                            });
                        } 
                    }
                    return a.addItem({
                        translation: "contextMenu.export",
                        tid: "export",
                        icon: "icon-toolbar-sharelist",
                        select: function() {
                            console.log($('#cl-customreport-container').scope());
                            $('#cl-customreport-container').scope().exportData('exportToExcel');
                        }
                    }), void e.resolve();
                });
            },
            template: ngTemplate,
            
            controller: ['$scope', function($scope) {

                $scope.size = {
                    clientHeight: -1,
                    clientWidth: -1
                }

                $scope.firstPaint = true;
                $scope.fieldsAndSortbarVisible = true;
                $scope.collapsed = false;
                $scope.minWidthCollapsed = 200;
                $scope.minHeightCollapsed = 200;


                $scope.data = {
                    tag: null,
                    tagColor: true,
                    sortOrder: 'SortByA',
                    activeTable: null,
                    displayText: 'Custom Report',
                    masterObjectList: [],
                    masterDimensions: [],
                    masterMeasures: []
                };

                $scope.report = {
                    tableID: '',
                    title: null,
                    report: [],
                    dimensions: [],
                    measures: [],
                    interColumnSortOrder: [],
                };

                var dragoverHandler = function(event) {
                    event.preventDefault();
                    event.stopPropagation();
                };

                $scope.reportConfig = {
                    group: {
                        name: "report",
                        put: ['dim', 'measure']
                    },
                    animation: 150,
                    ghostClass: "ghost",
                    onStart: function( /** ngSortEvent */ evt) {
                        $('body').on('dragover', '.qv-panel-wrap', dragoverHandler);
                    },
                    onEnd: function( /** ngSortEvent */ evt) {
                        $('body').off('dragover', '.qv-panel-wrap', dragoverHandler);
                       // $('#customreporttable').removeClass('prevent-pointers');
                    },
                    onSort: function( /** ngSortEvent */ evt) {
                        $scope.report.state.splice(evt.newIndex, 0, $scope.report.state.splice(evt.oldIndex, 1)[0]);
                        $scope.updateTable();
                    },
                };

                var app = qlik.currApp();

                var localStorageId = $scope.$parent.layout.qExtendsId ? $scope.$parent.layout.qExtendsId : $scope.$parent.layout.qInfo.qId;

                $scope.handleResize = function($element, allowCollapse) {

                    if ($element.context.clientHeight < $scope.minHeightCollapsed || $element.context.clientWidth < $scope.minWidthCollapsed) {
                        if (!$scope.collapsed && allowCollapse) {
                            $scope.collapsed = true;
                            $scope.updateTable();
                        }                    
                    } else {
                         if ($scope.collapsed) {
                            $scope.collapsed = false;
                            $scope.updateTable();
                        } 
                    }                    
                }


                $scope.getClass = function() {
                    return stateUtil.isInAnalysisMode() ? "" : "no-interactions";
                };
                
                function initMasterItems() {
                    var deferred = $q.defer();

                    app.getAppObjectList('masterobject', function(reply) {
                        $scope.data.masterObjectList = _.reduce(reply.qAppObjectList.qItems, function(acc, obj) {
                            if (obj.qData.visualization == 'table') {
                                if ($scope.data.tag == 'All tables') {
                                    acc.push(obj);
                                } else {
                                    _.each(obj.qMeta.tags, function(tag) {
                                        if (tag == $scope.data.tag) {
                                            acc.push(obj);
                                        }
                                    });
                                }
                            }
                            return acc;
                        }, []);
                        deferred.resolve(true);
                    });
                    return deferred.promise;
                }

                function initLibraryItems() {
                    app.getList('MeasureList', function(reply) {
                        $scope.data.masterMeasures = reply.qMeasureList;
                    });
                    app.getList('DimensionList', function(reply) {
                        $scope.data.masterDimensions = reply.qDimensionList;
                    });
                }

                $scope.loadActiveTable = function() {

                    var deferred = $q.defer();

                    $scope.report.state = [];
                    $scope.updateTable();
                    if( $scope.data.activeTable !== null) {
                        setTimeout(function() {
                            app.getObjectProperties($scope.data.activeTable.qInfo.qId).then(function(model) {
                                $scope.report.title = model.properties.title;
                                //Dimensions
                                var dataId = -1;
                                var dimensions = _.map(model._properties.qHyperCubeDef.qDimensions, function(dimension) {

                                    dataId = dataId + 1;

                                    if (dimension.qLibraryId) {
                                        var libraryItem = _.find($scope.data.masterDimensions.qItems, function(item) {
                                            return item.qInfo.qId == dimension.qLibraryId;
                                        });
                                        var libraryDimension = dimension;
                                        libraryDimension.qType = 'dimension';
                                        return {
                                            title: libraryItem.qMeta.title,
                                            description: libraryItem.qMeta.description,
                                            columnOptions: libraryDimension,
                                            type: 'dimension',
                                            selected: false,
                                            dataId: dataId
                                        }
                                    } else {
                                        return {
                                            title: dimension.qDef.qFieldLabels[0] == '' ? dimension.qDef.qFieldDefs[0] : dimension.qDef.qFieldLabels[0],
                                            description: '',
                                            columnOptions: dimension,
                                            type: 'dimension',
                                            selected: false,
                                            dataId: dataId
                                        }
                                    }
                                });

                                $scope.report.dimensions = $scope.data.sortOrder == 'SortByA' ? _.sortBy(dimensions, function(item) {
                                    return item.title;
                                }) : dimensions;

                                //Measures
                                var measures = _.map(model._properties.qHyperCubeDef.qMeasures, function(measure) {
                                    dataId = dataId + 1;

                                    if (measure.qLibraryId) {
                                        var libraryItem = _.find($scope.data.masterMeasures.qItems, function(item) {
                                            return item.qInfo.qId == measure.qLibraryId;
                                        });

                                        var libraryMeasure = measure;
                                        libraryMeasure.qType = 'measure';

                                        return {
                                            title: libraryItem.qMeta.title,
                                            description: libraryItem.qMeta.description,
                                            columnOptions: libraryMeasure,
                                            type: 'measure',
                                            selected: false,
                                            dataId: dataId
                                        }
                                    } else {
                                        return {
                                            title: measure.qDef.qLabel ? measure.qDef.qLabel : measure.qDef.qDef,
                                            description: '',
                                            columnOptions: measure,
                                            type: 'measure',
                                            selected: false,
                                            dataId: dataId
                                        }
                                    }
                                });
                                $scope.report.measures = $scope.data.sortOrder == 'SortByA' ? _.sortBy(measures, function(item) {
                                    return item.title;
                                }) : measures;
                                deferred.resolve(true);
                            });
                        }, 500);
                    } else {
                        deferred.resolve(false);
                    }
                
                    return deferred.promise;
                }

                $scope.changeTable = function() {
                    var state = {};
                    var localStorageToken = JSON.parse(localStorage.getItem(localStorageId));
                    if (undefined != localStorageToken && undefined != localStorageToken.states) {
                        state = localStorageToken.states[$scope.data.activeTable.qInfo.qId];
                        if (state) {
                            $scope.report.interColumnSortOrder = state.qInterColumnSortOrder ? state.qInterColumnSortOrder : [];
                        }
                    }
                    $scope.setReportState(state);
                }
                $scope.createTable = function() {
                    var deferred = $q.defer();
                    $(".rain").show();
                    $scope.loadActiveTable().then(function() {
                        app.visualization.create('table', [], {
                            title: $scope.report.title == '' ? $scope.data.activeTable.qMeta.title : $scope.report.title
                        }).then(function(visual) {
                            $scope.report.tableID = visual.id;
                            $(".rain").hide();
                            visual.show('customreporttable');
                            deferred.resolve(true);
                        });
                    });
                    return deferred.promise;
                }

                $scope.getInterColumnSortOrder = function() {
                    var deferred = $q.defer();

                    if ($scope.report.interColumnSortOrder.length == 0) {
                        app.getObject($scope.report.tableID).then(function(model) {
                            model.getEffectiveProperties().then(function(reply) {
                                var dimCount = reply.qHyperCubeDef.qDimensions.length;
                                var interColSortOrder = [];
                                _.each(reply.qHyperCubeDef.qInterColumnSortOrder, function(item) {
                                    if (item >= dimCount) {
                                        var newItem = {
                                            dataId: reply.qHyperCubeDef.qMeasures[item - dimCount].dataId,
                                            type: "measure"
                                        }
                                        newItem.qSortBy = reply.qHyperCubeDef.qMeasures[item - dimCount].qSortBy;
                                        if (reply.qHyperCubeDef.qMeasures[item - dimCount].qDef.qReverseSort) {
                                            newItem.qReverseSort = true
                                        }
                                        interColSortOrder.push(newItem);
                                    } else {
                                        var newItem = {
                                            dataId: reply.qHyperCubeDef.qDimensions[item].dataId,
                                            type: "dimension"
                                        }
                                        if (reply.qHyperCubeDef.qDimensions[item].qDef.qReverseSort) {
                                            newItem.qReverseSort = true
                                        }
                                        interColSortOrder.push(newItem);
                                    }
                                });
                                $scope.report.interColumnSortOrder = interColSortOrder;
                                deferred.resolve(true);
                            })
                        });
                    } else {
                        deferred.resolve(false);
                    }
                    return deferred.promise;
                };

                $scope.setReportState = function(state) {
                    $scope.createTable().then(function() {
                            var newState = [];
                            _.each(state.itemIds, function(itemId) {
                                var idx = $scope.report.dimensions.map(function(x) {
                                    return x.dataId;
                                }).indexOf(itemId);
                                if (idx > -1) {
                                    $scope.report.dimensions[idx].selected = true;
                                    newState.push($scope.report.dimensions[idx]);
                                } else {
                                    idx = $scope.report.measures.map(function(x) {
                                        return x.dataId;
                                    }).indexOf(itemId);
                                    if (idx > -1) {
                                        $scope.report.measures[idx].selected = true;
                                        newState.push($scope.report.measures[idx]);
                                    }
                                }
                            });
                            $scope.report.state = newState;
                            $scope.updateTable();
                        });
                };

                $scope.updateTable = function() {
                    if ($scope.report.tableID != '') {
                        if ($scope.report.state.length > 0) {
                            var dimensions = _.reduce($scope.report.state, function(acc, obj) {
                                if (obj.type == 'dimension') {
                                    obj.columnOptions.dataId = obj.dataId
                                    acc.push(obj.columnOptions);
                                }
                                return acc;
                            }, []);

                            var measures = _.reduce($scope.report.state, function(acc, obj) {
                                if (obj.type == 'measure') {
                                    obj.columnOptions.dataId = obj.dataId
                                    acc.push(obj.columnOptions);
                                }
                                return acc;
                            }, []);

                            var columnOrder = [];
                            var measureCount = 0;
                            var dimensionCount = 0;

                            _.each($scope.report.state, function(obj) {
                                if (obj.type == 'measure') {
                                    columnOrder.push(dimensions.length + measureCount);
                                    measureCount = measureCount + 1;
                                } else {
                                    columnOrder.push(dimensionCount);
                                    dimensionCount = dimensionCount + 1;
                                }
                            });

                            var columnWidths = [];

                            for (var i = 0; i < $scope.report.state.length; i++) {
                                columnWidths.push(-1);
                            }

                            $scope.getInterColumnSortOrder().then(function() {
                                var qInterColumnSortOrder = [];

                                _.each($scope.report.interColumnSortOrder, function(item) {
                                    if (item.type == "measure") {
                                        var idx = measures.map(function(x) {
                                            return x.dataId;
                                        }).indexOf(item.dataId);
                                        if (idx > -1) {
                                            qInterColumnSortOrder.push(idx + dimensionCount);
                                            measures[idx].qSortBy = item.qSortBy;
                                            if (item.qReverseSort) {
                                                measures[idx].qDef.autoSort = false
                                                measures[idx].qDef.qReverseSort = item.qReverseSort
                                            }
                                        }
                                    } else {
                                        var idx = dimensions.map(function(x) {
                                            return x.dataId;
                                        }).indexOf(item.dataId);
                                        if (idx > -1) {
                                            qInterColumnSortOrder.push(idx);
                                            if (item.qReverseSort) {
                                                dimensions[idx].qDef.autoSort = false
                                                dimensions[idx].qDef.qReverseSort = item.qReverseSort
                                            }
                                        }

                                    }
                                });

                                //add newly added item to qInterColumnSortOrder 
                                if (qInterColumnSortOrder.length != columnOrder.length) {
                                    var missingValues = _.difference(columnOrder, qInterColumnSortOrder)
                                    _.each(missingValues, function(value) {
                                        qInterColumnSortOrder.push(value);
                                    })
                                }
                                app.getObject($scope.report.tableID).then(function(visual) {
                                    visual.clearSoftPatches();
                                    var patches = [{
                                            "qOp": "replace",
                                            "qPath": "qHyperCubeDef/qDimensions",
                                            "qValue": JSON.stringify(dimensions)
                                        }, {
                                            "qOp": "replace",
                                            "qPath": "qHyperCubeDef/qMeasures",
                                            "qValue": JSON.stringify(measures)
                                        }, {
                                            "qOp": "replace",
                                            "qPath": "qHyperCubeDef/columnOrder",
                                            "qValue": JSON.stringify(columnOrder)
                                        },

                                        {
                                            "qOp": "replace",
                                            "qPath": "qHyperCubeDef/columnWidths",
                                            "qValue": JSON.stringify(columnWidths)
                                        }, {
                                            "qOp": "replace",
                                            "qPath": "qHyperCubeDef/qInterColumnSortOrder",
                                            "qValue": JSON.stringify(qInterColumnSortOrder)
                                        },
                                    ];
                                    visual.applyPatches(patches, true);
                                    $scope.serializeReport();
                                });
                            })
                        } else {
                            app.getObject($scope.report.tableID).then(function(visual) {
                                visual.clearSoftPatches();
                                $scope.report.interColumnSortOrder = [];
                                $scope.serializeReport();
                            });
                        }
                        $(".rain").hide();
                    }
                }

                $scope.selectItem = function(item) {
                    var idx = $scope.report.state.map(function(x) {
                        return x.dataId;
                    }).indexOf(item.dataId);
                    if (idx > -1) {
                        item.selected = false;
                        $scope.report.state.splice(idx, 1);
                    } else {
                        item.selected = true;
                        $scope.report.state.push(item);
                    }
                    $scope.updateTable();
                }

                $scope.clearAll = function() {
                    _.each($scope.report.dimensions, function(dimension) {
                        dimension.selected = false;
                    })

                    _.each($scope.report.measures, function(measure) {
                        measure.selected = false;
                    })

                    $scope.report.state = [];
                    $scope.updateTable();

                }

                $scope.removeItem = function(item) {
                    $scope.report.state = _.without($scope.report.state, item);

                    if (item.type == 'measure') {
                        var idx = $scope.report.measures.map(function(x) {
                            return x.dataId;
                        }).indexOf(item.dataId);
                        $scope.report.measures[idx].selected = false;
                    } else {
                        var idx = $scope.report.dimensions.map(function(x) {
                            return x.dataId;
                        }).indexOf(item.dataId);
                        $scope.report.dimensions[idx].selected = false;
                    }
                    $scope.updateTable();
                }
                $scope.hideFieldAndSortbar = function() { 
                    $scope.fieldsAndSortbarVisible = false;
                    $scope.updateTable();
                }

                $scope.showFieldAndSortbar = function() { 
                    $scope.fieldsAndSortbarVisible = true;
                    $scope.updateTable();
                }
                $scope.exportData = function(string) {
                    if ($scope.report.state.length > 0) {
                        var options = {};
                        switch (string) {
                            //app level commands
                            case 'exportToExcel':
                                options = {
                                    download: true
                                };
                                break;
                            case 'exportAsCSV':
                                options = {
                                    format: 'CSV_C',
                                    download: true
                                };
                                break;
                            case 'exportAsCSVTab':
                                options = {
                                    format: 'CSV_T',
                                    download: true
                                };
                                break;
                            case 'exportToClipboard':
                                options = {
                                    download: true
                                };
                                break;
                        }
                        app.visualization.get($scope.report.tableID).then(function(visual) {
                            visual.table.exportData(options);
                        });
                    }
                }

                $scope.serializeReport = function() {
                    var localStorageToken = JSON.parse(localStorage.getItem(localStorageId));
                    if (null === localStorageToken || undefined === localStorageToken || undefined === localStorageToken.states) { 
                        localStorageToken = { activeTableId: "",
                                                states: {}
                                            };
                    } 
                    var itemIds = [];
                    _.each($scope.report.state, function(item) {
                        itemIds.push(item.dataId);
                    })

                    $scope.getInterColumnSortOrder().then(function() {
                        var state = {
                            qId: $scope.data.activeTable.qInfo.qId,
                            itemIds: itemIds,
                            qInterColumnSortOrder: $scope.report.interColumnSortOrder
                        }
                        localStorageToken.activeTableId = state.qId;
                        localStorageToken.states[state.qId] = state
                        
                        $scope.report.interColumnSortOrder = [];
                        localStorage.setItem(localStorageId, JSON.stringify(localStorageToken));
                        console.log('serialized state:', localStorageToken);
                    });
                }

                $scope.deserializeReport = function() {
                    var state = {};
                    var localStorageToken = JSON.parse(localStorage.getItem(localStorageId));
                    if (undefined != localStorageToken && undefined != localStorageToken.states) {
                        console.log('deserialized state:', localStorageToken);
                        state = localStorageToken.states[localStorageToken.activeTableId] 
                        $scope.report.interColumnSortOrder = state.qInterColumnSortOrder ? state.qInterColumnSortOrder : [];
                        $scope.data.activeTable = _.find($scope.data.masterObjectList, function(item) {
                            return item.qInfo.qId == state.qId;
                        });
                        $scope.setReportState(state);                        
                    }
                }

                $scope.$on('$destroy', function() {
                    $scope.serializeReport();
                });

                $scope.$watchCollection('layout.props.tagSetting', function(newTag) {
                    $scope.data.tag = newTag;
                    initMasterItems();
                });

                $scope.$watchCollection('layout.props.tagColor', function(newStyle) {
                    $scope.data.tagColor = newStyle;
                });

                $scope.$watchCollection('layout.props.collapseMinWidth', function(newWidth) {
                    $scope.minWidthCollapsed = newWidth;
                });

                 $scope.$watchCollection('layout.props.collapseMinHeight', function(newHeight) {
                    $scope.minHeightCollapsed = newHeight;
                });


                $scope.$watchCollection('layout.props.displayText', function(newText) {
                    $scope.data.displayText = newText;
                });

                $scope.$watchCollection('layout.props.dimensionSortOrder', function(newStyle) {
                    $scope.data.sortOrder = newStyle;
                    $scope.loadActiveTable();
                });

                $scope.getListMaxHeight = function(listType) {
                    var listHeight = 38;
                    var dimCount = $scope.report.dimensions.length
                    var measureCount = $scope.report.measures.length
                    var labelsAndButtons = 140;
                    var halfHeight = (($scope.size.clientHeight - labelsAndButtons) / 2)
                    var dimListUnusedSize = halfHeight < listHeight * dimCount ? 0 : halfHeight - listHeight * dimCount;
                    var measureListUnusedSize = halfHeight < listHeight * measureCount ? 0 : halfHeight - listHeight * measureCount;

                    if (dimCount > 0) {
                        if (listType == 'dimension') {
                            return {
                                "max-height": (halfHeight + measureListUnusedSize) + "px"
                            };
                        } else {
                            return {
                                "max-height": (halfHeight + dimListUnusedSize) + "px"
                            };
                        }
                    } else {
                        return {
                            "height": halfHeight + "px"
                        };
                    }
                }

                $scope.getTableHeight = function() {
                    var labelsAndButtons = 70;

                    $('#reportSortable').height();

                    var reportSortableHeight = $('#reportSortable').height();
                    if (!$scope.fieldsAndSortbarVisible) {
                        return { "height": $scope.size.clientHeight + "px" }
                    } else {
                        return { "height": ($scope.size.clientHeight - labelsAndButtons - reportSortableHeight) + "px", "padding-top":"18px" }
                    }
                }
                $scope.getContainerWidth = function(container) {
                    var containerLeftWidth = 220;
                    var containerWidth = {};
                    if (container == 'left') {
                       containerWidth = containerLeftWidth;
                    } else {
                        if (!$scope.fieldsAndSortbarVisible) {
                            containerWidth =  $scope.size.clientWidth;
                        } else {
                            containerWidth = $scope.size.clientWidth - containerLeftWidth - 20;
                        }
                    }
                    return { "width": containerWidth + "px" }
                }

                initLibraryItems();
                initMasterItems().then(function(reply) {
                    var el = document.getElementById('reportSortable');
                    sortable.create(el, $scope.reportConfig);

                    $scope.deserializeReport();

                    $(".rain").hide();
                });
            }]
        };
    });