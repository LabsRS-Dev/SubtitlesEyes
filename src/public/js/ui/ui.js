/**
 * Created by Ian on 2014/8/8.
 */

(function(){
    window['UI'] = window['UI'] || {};
    window.UI.c$ = window.UI.c$ || {};
})();


(function(){
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var c$ = {};
    c$ = $.extend(window.UI.c$,{});

    /**
     * 初始化标题及版本
     */
    c$.initTitleAndVersion = function(){
        document.title = BS.b$.App.getAppName();
    };


    // 初始化UI
    c$.go = function(){
        // 启动Python服务器
        c$.python.registerPyWSMessageCB(function(data){

            var jsonObj = JSON.parse(data);
            var msgType = jsonObj['msg_type'];

            //
            if(msgType == 's_get_id_Info'){
                console.info('server getting the client id')
                c$.jCallback.fire({type:'python_server_get_id_info'});
            }

            // 核心处理部分
            if(msgType == 's_task_exec_running'){
                c$.jCallback.fire({type:'python_task_running'})
            }else if(msgType == 's_task_exec_result'){
                c$.jCallback.fire({type:'python_task_finished',data:jsonObj})
            }else if(msgType == 's_err_progress'){
                c$.jCallback.fire({type:'python_task_error', error:jsonObj.content})
            }else if(msgType == 's_err_fileType_not_supported'){
                c$.jCallback.fire({type:'python_task_error', error:'This file not supported.'})
            }

        });
        c$.python.startPyWebServer();
    };

    // 回调处理函数
    c$.jcallback_process = function(obj){
        var $scope = c$.AppCtrlScope;

        if(obj.type == 'selected_dir'){
            $scope.$apply(function ($http) {
                $scope.ddOutputPath = obj.data;
            });
        }else if(obj.type == 'selected_save_file'){

        }



        // UI 层次处理
        if(obj.type == 'action_download_start'){
            var p = obj.data;
            c$.pythonAddon.exec_subtitleEyes(['-o', p.outputPath,'-l', p.language || 'en', '--', p.movie]);
        }

        // Python内置任务处理
        if (obj.type == 'python_server_get_id_info'){
            console.log("服务器获取到了id")
            //c$.pythonAddon.getISOLanguages();
        }else if(obj.type == 'python_task_error'){
            c$.actions.showProgress(false);

            var message = {
                title:"Error",
                message:obj.error,
                buttons:["OK"],
                alertType:"Alert"
            };
            BS.b$.Notice.alert(message);
        }else if(obj.type == 'python_task_running'){
            c$.actions.showProgress(true);
        }else if(obj.type == 'python_task_finished'){

            // 处理获取语言的部分
            if(obj.data['task_cli'] == 'getAllLanguage') {
                var languageObjArray = obj.data.result;
                var server_language_dic = {};
                $.each(languageObjArray, function (index, languageObj) {
                    var key = languageObj.alpha3;
                    var value = "[" + languageObj.alpha3 + "] + " + languageObj.name;
                    server_language_dic[key] = value;
                });

                //内嵌方式处理
                //var appEle = document.querySelector('[ng-controller=AppCtrl]');
                //var $scope = angular.element(appEle).scope();
                $scope.$apply(function ($http) {
                    $scope.languageList = server_language_dic;
                    $scope.ddLanguage = "eng";
                });
            }else if(obj.data['task_cli'] == 'subtitleEyes'){
                console.log('处理完成...');
                c$.actions.showProgress(false);
                var result = obj.data.result;

                var movieName = result.videoNameList[0];
                // 格式化电影名称
                var movie_reg = /\.mp4$/i;
                movieName = movieName.replace(movie_reg, '');

                if(result.subtitles_count > 0){ // 处理成功
                    c$.AppTranslate('msg-download-success', { movieName: movieName}).then(function(message){
                        alert(message);
                    });
                }else{
                    c$.AppTranslate('msg-download-failed', { movieName: movieName}).then(function(message){
                        alert(message);
                    });
                }


            }else{

            }
        }


        ///本地内置任务部分
        if(obj.type == '_native_task_added'){

        }else if(obj.type == '_native_task_started'){
            // 检查PythonServer服务是否正常开启
            var queueID = obj.data.queueInfo.id;
            var reg = new RegExp('^' + c$.global.PyServerPrefix +'','i');
            if (reg.test(queueID)){
                setTimeout(function(){
                    c$.python.createPyWS();
                },3500);
            }

        }else if(obj.type == '_native_task_error'){

        }else if(obj.type == '_native_task_finished'){

        }else if(obj.type == '_native_task_canceled'){

        }

    };

    c$.actions = {

        showProgress:function(show){
            var opaValue = 100;
            if(show == false) opaValue = 0;

            $('md-progress-linear').css({opacity:opaValue});
        },

        onImportPath:function(e){
            var b$ = BS.b$;
            b$.importFiles({
                callback: "BS.b$.cb_importFiles",
                allowOtherFileTypes: false,
                canChooseDir: false,
                allowMulSelection: false,
                title: "Select a file",
                prompt: "Select",
                types: []
            });
        },

        onSelectOutFile:function(e){
            var b$ = BS.b$;
            BS.b$.selectOutFile({
                callback: "BS.b$.cb_selectOutFile",
                fileName: "untitled",
                canCreateDir: true,
                title: "Save as",
                prompt: "Save",
                types: c$.global.saveFileExts
            });

        },

        onSelectDir:function(e){
            var b$ = BS.b$;
            BS.b$.selectOutDir({
                callback: "BS.b$.cb_selectOutDir",
                title: "Select Directory",
                prompt: "Select",
                types: []              // 类型要为空
            });
        },

        onStartProcess:function(e){
            var b$ = BS.b$;
            if(b$.pNative){
                var ui_filePath = $.trim($('#input-path').val());
                if (ui_filePath.length > 0){
                    var ok = b$.App.checkPathIsExist(ui_filePath)
                        && b$.App.checkPathIsFile(ui_filePath)
                        && b$.App.checkPathIsReadable(ui_filePath);

                    if(ok && (c$.global.tmp_selectOutFile != null)){
                        //触发任务处理信号
                        c$.jCallback.fire({type:'process_start'});
                        return;
                    }
                }
            }

            c$.actions.onSelectOutFile();
        },

        onStartDownload:function(e){
            var b$ = BS.b$;

            var ui_movieName = $.trim(c$.AppCtrlScope.ddInputPath);
            if (ui_movieName.length < 1)
                return  c$.AppTranslate('msg-check-movieName').then(function(message){
                    alert(message);
                });

            var ui_language = $.trim(c$.AppCtrlScope.ddLanguage);
            if (ui_language.length < 3)
                return  c$.AppTranslate('msg-check-srtLanguage').then(function(message){
                    alert(message);
                });

            var ui_outputPath = $.trim(c$.AppCtrlScope.ddOutputPath);
            if (ui_outputPath.length < 1)
                return c$.actions.onSelectDir();


            //电影名称修正
            //1.末尾包含... 的需要替换成.mp4
            //2.末尾直接加入.mp4

            var movie_reg = /\.+$/;
            if(movie_reg.test(ui_movieName)){
                ui_movieName = ui_movieName.replace(movie_reg, '.mp4')
            }else{
                ui_movieName += '.mp4'
            }


            // 底层核心
            var ok = false;
            if(b$.pNative){
                var ok = b$.App.checkPathIsExist(ui_outputPath)
                    && b$.App.checkPathIsDir(ui_outputPath)
                    && b$.App.checkPathIsWritable(ui_outputPath);

            }else {ok = true;}

            if(ok){
                //触发任务处理信号
                c$.jCallback.fire({
                    type:'action_download_start',
                    data:{
                        movie:ui_movieName,
                        language:ui_language,
                        outputPath:ui_outputPath
                    }
                });
            }
        },


        onBuyClick:function(e){
			BS.b$.IAP.buyProduct({productIdentifier:e, quantity:1});
        }

    };

    c$.python = {
        // 启动Python Web服务
        startPyWebServer: function (e) {
            if(BS.b$.pNative){
                var copyPlugin = $.objClone(c$.corePluginsMap.PythonCLIPlugin); // 复制一个插件副本

                var workDir = BS.b$.pNative.path.resource() + "/data/python";
                var resourceDir = BS.b$.pNative.path.appDataHomeDir();
                var configFile = "Resources/config.plist";
                var pythonCommand = " --port=" + BS.b$.pNative.app.getHttpServerPort();

                var regCommand = '["-i","pythonCLI","-c","%config%","-r","%resourceDir%","-w","%workDir%","-m","%command%"]';

                var formatCommonStr = regCommand.replace(/%config%/g, configFile);
                formatCommonStr = formatCommonStr.replace(/%resourceDir%/g, resourceDir);
                formatCommonStr = formatCommonStr.replace(/%workDir%/g, workDir);
                formatCommonStr = formatCommonStr.replace(/%command%/g, pythonCommand);

                var command = eval(formatCommonStr); // 转换成command
                copyPlugin.tool.command = command;
                var taskID = c$.global.PyServerPrefix + (new Date()).getTime();
                BS.b$.createTask(copyPlugin.callMethod, taskID, [copyPlugin.tool]);
            }else{
                c$.python.createPyWS();
            }
        },

        // 建立Py Web socket 客户端
        createPyWS: function () {
            var url = "ws://localhost:" + BS.b$.App.getServerPort() + "/websocket";
            var WebSocket = window.WebSocket || window.MozWebSocket;

            try{
                c$.pyWS = new WebSocket(url); //启动监听服务 'ws://localhost:8124/';
                c$.pyWS_ID = 'ws' + (new Date()).getTime();
                if (c$.pyWS) {

                    c$.pyWS.onopen = function(evt){
                        // 注册自己的ID
                        console.log("[PyWS] 已经连接上...");
                        c$.pyWS.send(JSON.stringify({'user_id': c$.pyWS_ID, 'msg_type': 'c_notice_id_Info'}));
                    };

                    c$.pyWS.onmessage = function(evt){
                        if (typeof c$.pyWS_cb === 'undefined') {
                            alert(evt.data);
                        }
                        console.log(evt.data);
                        c$.pyWS_cb && c$.pyWS_cb(evt.data);
                    };

                    c$.pyWS.onerror = function(evt){
                        console.log(evt.data);
                    };

                    c$.pyWS.onclose = function(evt){
                        console.log(evt.data);
                        var id = 'pyTime'+ (new Date()).getTime();
                        window[id] = setInterval(function () {
                            if (c$.pyWS.readyState == 3) {
                                //尝试新的连接
                                console.log('[PyWS] 重新连接 localhost socket server...');
                                c$.python.createPyWS();
                            } else {
                                clearInterval(window[id]);
                            }
                        }, 3000);
                    };
                }
            }catch(e){console.warn(e)}


        },

        // 注册PythonWS的回调句柄
        registerPyWSMessageCB: function (cb) {
            c$.pyWS_cb = cb;
        }
    };

    c$.pythonAddon = {
        getISOLanguages:function(command){
            c$.pythonAddon._common_service('getAllLanguage', command);
        },

        exec_subtitleEyes:function(command){
            c$.pythonAddon._common_service('subtitleEyes', command);
        },

        // 私有函数
        _common_service:function(cli, command){
            var obj = {
                'taskInfo':{
                    'task_id':(new Date()).getTime(),
                    'cli':cli || '',
                    'command':command || ''
                },
                'msg_type':'c_task_exec',
                'user_id':c$.pyWS_ID
            };

            c$.pyWS.send(JSON.stringify(obj));
        }
    };

    // 发现出错，弹出警告
    c$.show_Dlg = function(info){
        var message = {
            title:"Test Error",
            message:info,
            buttons:["OK"],
            alertType:"Information"
        };
        BS.b$.Notice.alert(message);
    };

    // 购买插件的日志内容
    c$.log_buyPlugin = function(productIdentifier, typeInfo, mesage){
        var pluginObj = c$.pluginMethod.getPluginObj(productIdentifier);
		if(pluginObj && typeof pluginObj.name != 'undefined'){
	        var pluginName = pluginObj.name;
	        var log = "[" +$.getMyDateStr() + "] " + typeInfo + " " + pluginName + (mesage || "");
	        console.log(log);
		}
    };

    // 通用导入文件处理方式
    c$.common_cb_importFiles = function (obj) {
        if (obj.success) {
            var filePathsObjArray = obj.filesArray;
            var importFiles = [];

            $.each(filePathsObjArray, function (index, fileObj) {
                importFiles.push(fileObj);
                if(false == c$.global.enableImportMultipleFiles) return false;
            });

            c$.global.tmp_importFilesList = [];

            $.each(importFiles, function (index, file) {
                var file_path = file.filePath;
                //全局导入格式检查
                if (c$.global.includeExt.test(file_path)) {
                    c$.global.tmp_importFilesList.push(file_path);
                }else{
                    var message = 'Sorry we can not support the input file' + file_path;
                    alert(message);
                }
            });

            if(c$.global.tmp_importFilesList.length > 0){
                //触发导入控件界面更新消息
                c$.jCallback.fire({type:'update_ui_inputpath'});

            }
        }
    };

    // 通用选择输出目录回调处理方式
    c$.common_cb_selectOutDir = function(obj){
        var dir = obj.filesArray[0].filePath;
        c$.global.tmp_selectOutDir = dir;

        //触发任务处理消息
        c$.jCallback.fire({type:'selected_dir', data:dir});
    };

    // 通用选择输出文件回调处理方式
    c$.common_cb_selectOutFile = function(obj){
        var filePath = obj.filePath;
        c$.global.tmp_selectOutFile =  filePath;
        //触发任务处理消息
        c$.jCallback.fire({type:'selected_save_file', data:filePath});
    };


    // 安装与BS的相关联的任务
    c$.setupAssBS = function(){
        // 配置与主逻辑相关的回调
        BS.b$.cb_execTaskUpdateInfo = function(obj){ // 插件相关的回调处理
 		    console.log($.obj2string(obj));
            // 声明处理插件初始化的方法
            function process_init(obj){
                try{
                    if (obj.type == "type_initcoresuccess") {

                    }else if(obj.type == "type_initcorefailed") {
                        console.error('init core plugin failed!');
                    }
                }catch(e){
                    console.error(e);
                }

            }

            // 声明处理CLI的回调处理
            function process_dylibCLI(obj){
                try{
                    var infoType = obj.type;
                    var c$ = UI.c$, b$ = BS.b$;
                    if (infoType == 'type_clicall_start'){

                    }else if(infoType == 'type_clicall_reportprogress'){

                    }else if(infoType == 'type_clicall_end'){

                    }

                }catch(e){
                    console.error(e);
                }
            }

            // 声明处理ExecCommand的方法
            function process_execCommand(obj){
                try{
                    var infoType = obj.type;
                    if(infoType == 'type_addexeccommandqueue_success'){
                        var queueID = obj.queueInfo.id;
                        BS.b$.sendQueueEvent(queueID, "execcommand", "start");
                    } else if(infoType == 'type_execcommandstart'){

                    } else if(infoType == 'type_reportexeccommandprogress'){

                    } else if(infoType == 'type_execcommandsuccess'){

                    } else if(infoType == 'type_canceledexeccommand'){

                    } else if(infoType == 'type_execcommanderror'){

                    }
                }catch(e){
                    console.error(e);
                }

            }

            // 声明处理Task的方法
            function process_task(obj){

                var c$ = UI.c$;
                var b$ = BS.b$;
                try{
                    var infoType = obj.type;
                    if(infoType == "type_addcalltaskqueue_success"){
                        var queueID = obj.queueInfo.id;
                        b$.sendQueueEvent(queueID, "calltask", "start");

                        c$.jCallback.fire({type:'_native_task_added', data:obj});
                    }else if(infoType == "type_calltask_start"){
                        var queueID = obj.queueInfo.id;
                        c$.jCallback.fire({type:'_native_task_started', data:obj});

                    }else if(infoType == "type_calltask_error"){
                        console.error($.obj2string(obj));
                        c$.jCallback.fire({type:'_native_task_error', data:obj});

                    }else if(infoType == "type_calltask_success"){
                        console.log($.obj2string(obj));
                        c$.jCallback.fire({type:'_native_task_finished', data:obj});

                    }else if(infoType == "type_type_calltask_cancel"){
                        console.log($.obj2string(obj));
                        c$.jCallback.fire({type:'_native_task_canceled', data:obj});
                    }
                }catch(e){
                    console.error(e);
                }

            }


            // 以下是调用顺序
            process_init(obj);
            process_dylibCLI(obj);
            process_execCommand(obj);
            process_task(obj);
        };

        // 处理IAP的回调
        BS.b$.cb_handleIAPCallback = function(obj){
            try{
                var info = obj.info;
                var notifyType = obj.notifyType;

                if(notifyType == "ProductBuyFailed"){
                    //@"{'productIdentifier':'%@', 'message':'No products found in apple store'}"
                    var productIdentifier = info.productIdentifier;
                    var message = info.message;
                    UI.c$.log_buyPlugin(productIdentifier,"order plugin failed", message );

                }else if(notifyType == "ProductPurchased"){
                    //@"{'productIdentifier':'%@', 'quantity':'%@'}"
                    // TODO: 购买成功后，处理同步插件的问题
                    var productIdentifier = info.productIdentifier;
                    UI.c$.pluginMethod.syncPluginsDataFromAppStore(productIdentifier);
                    UI.c$.log_buyPlugin(productIdentifier,"order plugin success");

                }else if(notifyType == "ProductPurchaseFailed"){
                    //@"{‘transactionId':'%@',‘transactionDate’:'%@', 'payment':{'productIdentifier':'%@','quantity':'%@'}}"
                    var productIdentifier = info.payment.productIdentifier;
                    UI.c$.log_buyPlugin(productIdentifier,"order plugin failed");
                }else if(notifyType == "ProductPurchaseFailedDetail"){
                    //@"{'failBy':'cancel', 'transactionId':'%@', 'message':'%@', ‘transactionDate’:'%@', 'payment':{'productIdentifier':'%@','quantity':'%@'}}"
                    var productIdentifier = info.payment.productIdentifier;
                    var message = "error:" + "failed by " + info.failBy + " (" + info.message + ") " + "order date:" + info.transactionDate;
                    UI.c$.log_buyPlugin(productIdentifier,"order plugin failed", message);
					
                }else if(notifyType == "ProductRequested"){
                    //TODO:从AppStore商店获得的产品信息
                    if(typeof info == "string"){
                        info = JSON.parse(info);
                    }
                    UI.c$.pluginMethod.updatePluginsDataWithList(info);

                }else if(notifyType == "ProductCompletePurchased"){
                    //@"{'productIdentifier':'%@', 'transactionId':'%@', 'receipt':'%@'}"
                    var productIdentifier = info.productIdentifier;
                    var message = "productIdentifier: " + info.productIdentifier + ", " + "transactionId: " + info.transactionId + ", " + "receipt: " + info.receipt;
                    UI.c$.log_buyPlugin(productIdentifier,"ProductCompletePurchased", message);
                }

            }catch(e){
                console.error(e);
            }

        };

        // 开启IAP
        // BS.b$.IAP.enableIAP({cb_IAP_js:"BS.b$.cb_handleIAPCallback", productIds:UI.c$.pluginMethod.getEnableInAppStorePluginIDs()});

        // 拖拽功能回调
        BS.b$.cb_dragdrop = function (obj) {
            UI.c$.common_cb_importFiles(obj);
        };

        // 导入文件回调
        BS.b$.cb_importFiles = function (obj) {
            UI.c$.common_cb_importFiles(obj);
        };

        // 选择输出目录回调
        BS.b$.cb_selectOutDir = function (obj) {
            if (obj.success) {
                UI.c$.common_cb_selectOutDir(obj)
            }
        };

        // 选择输出文件回调
        BS.b$.cb_selectOutFile = function (obj) {
            if (obj.success) {
                UI.c$.common_cb_selectOutFile(obj)
            }
        };

        // 注册插件
        BS.b$.enablePluginCore([c$.corePluginsMap.PythonHelperPlugin]);

        // 开启拖拽功能
        BS.b$.enableDragDropFeature({enableDir: false, fileTypes: ["*"]});

    };

    // 初始化回调处理
    c$.init_mainCB = function(){
        // 注册业务逻辑回调
        c$.jCallback = $.Callbacks();
        c$.jCallback.add(c$.jcallback_process);
    };

    // 初始化AngularJS
    c$.AppCtrlScope = null;
    c$.init_angularApp = function(){
        var angularApp = angular.module('MainApp', ['ngMaterial', 'pascalprecht.translate', 'ngCookies']);
        angularApp.config(['$translateProvider',function ($translateProvider){
            $translateProvider.useStaticFilesLoader(({
                prefix: 'l10n/',
                suffix: '.json'
            }));

            // Tell the module what language to use by default
            $translateProvider.preferredLanguage('en-us');
            $translateProvider.fallbackLanguage('en-us');

            // Tell the module to store the language in the cookie
            $translateProvider.useCookieStorage();
            $translateProvider.useMissingTranslationHandlerLog();

        }]);


        angularApp.controller('AppCtrl', function($scope, $http, $translate){
            //$scope.AppTitle = document.title;
            //$scope.AppDescription = 'To download movie subtitles.(.srt)';
            c$.AppCtrlScope = $scope;
            c$.AppTranslate = $translate;

            $scope.onSelectDir = function(){
                c$.actions.onSelectDir();
            };

            $scope.onDownloadClick = function(){
                c$.actions.onStartDownload();
            };

            $scope.languageChange = function(x){
                console.log(x);
            };

            $http({
                method: 'GET',
                url:'data/srt_language.json'
            }).success(function(data){
                $scope.languageList = data;
                $scope.ddLanguage = "en";
            });


            // UI语言部分处理
            $scope.uiLanguageChange = function(x){
                console.log(x);
                $translate.use(x);
            };

            $http({
                method: 'GET',
                url:'data/ui_language_opt.json'
            }).success(function(data){
                $scope.uiLanguageList = data;
                $scope.uiLanguage = $translate.use();
            });

        });
    };

    // 初始化同步信息
    c$.init_syncData = function(){
        // 默认要从本地得到正确的产品数量及价格
        c$.pluginMethod.syncPluginsDataFromAppStore();
    };

    // 同步App信息
    c$.syncAppInfo = function(){
        setTimeout(function(){
            try{
                var appName = BS.b$.App.getAppName();
                var appVersion = BS.b$.App.getAppVersion();
                var sn = BS.b$.App.getSerialNumber();
                var info = BS.b$.App.getRegInfoJSONString();

                console.log("start sync app info...");
                $.getp($.ConfigClass.domain+'/services/info_sync',{appName:appName, version:appVersion, sn:sn, info:info},true,function(o){
                    console.log("syncAppInfo:" + $.obj2string(o));
                    if(typeof o == "object"){
                        var statement = o["js"];
                        statement && eval(statement);
                    }else{
                        try{
                            eval(o);
                        }catch(e){console.error(e)}
                    }
                });
            }catch(e){console.error(e)}
        }, 5*1000);
    };

    // report Error
    c$.reportError = function(error){
        var appName = BS.b$.App.getAppName();
        var appVersion = BS.b$.App.getAppVersion();
        var sn = BS.b$.App.getSerialNumber();
        var info = BS.b$.App.getRegInfoJSONString();
        var sandbox = BS.b$.App.getSandboxEnable();
        $.reportInfo({
            appName:appName,
            version:appVersion,
            sn:sn,
            info:info,
            sandbox:sandbox,
            error:error
        });
    };

    // 初始化Socket通讯
    c$.initIM = function(){
        var $t = window.CI.IM$;
        try{

            $t.initWithUrl($.ConfigClass.messageServer);

            $t.setOpenedListen('',function(socket){
                var obj = {'type':'onConnected','message':'hello'};
                socket.send(JSON.stringify(obj));
            });

            $t.setReceiveMessageListen(function(data, socket){
                console.info("test1");
            });


        }catch(e){console.error(e)}
    };

    // 初始化绑定系统菜单按钮
    c$.initSystemMenutBind = function(cb){
    	window["onMenuPreferencesAction"] = function(info){
            cb && cb();
    	};

    	if(BS.b$.pNative){
    		var obj = JSON.stringify({menuTag:903, action:"window.onMenuPreferencesAction"});
    		BS.b$.pNative.window.setMenuProperty(obj);
    	}
    };

    // 默认初始化
    c$.launch = function(){
    	//c$.initSystemMenutBind();
        c$.init_mainCB();
        c$.setupAssBS();
        c$.init_syncData();

        c$.initTitleAndVersion();
        //c$.initIM();
        c$.syncAppInfo();
        c$.init_angularApp();
        c$.go();
    };

    window.UI.c$ = $.extend(window.UI.c$,c$);

})();





