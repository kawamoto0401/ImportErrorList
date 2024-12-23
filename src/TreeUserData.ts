import internal = require('stream');
import Tree from 'ts-tree-structure';
import type { Node } from 'ts-tree-structure';;


type NodeType = { id: number, name: string, row: number, dataID: number, toolTip: string, treeType: number, warninglevel: number};


export interface RequstData {
    name: string;
    row: number;
    dataID: number;
    toolTip: string;
    warninglevel: TreeWarningLevel;
}

export enum TreeType {
    none = 0,
    root = 1,
    subjectRoot = 10,
    fileRoot = 11,
    tagRoot = 12,
    dir = 13,
    node = 14,
    data = 15,
}

export enum TreeWarningLevel {
    none = 0,
    error = 1,
    warning = 2,
    comment = 3
}

// ツリーデータの内部データ
export class TreeUserData {

    /**
      *  インスタンス
      */
    private static _instance: TreeUserData;

    /**
     * インスタンスの取得
     */
    public static getInstance(): TreeUserData {
        // インスタンスが存在しない場合、new演算子でインスタンスを作成
        if (!this._instance) {
            this._instance = new TreeUserData(TreeUserData.getInstance);
        }

        // 生成済みのインスタンスを返す
        return this._instance;
    }

    private tree: Tree | undefined;
    private root: any | undefined;
    private count: number = 100;
   
    /**
     * コンストラクタ
     */
    constructor(caller: Function) {
        if (caller === TreeUserData.getInstance) {
            this.tree = new Tree();
        }
        else if (TreeUserData._instance) {
            throw new Error("既にインスタンスが存在するためエラー。");
        }
        else {
            throw new Error("コンストラクタの引数が不正な為エラー。");
        }
    }


    public init() {

        if( !this.tree ) {
            return;
        }

        let root = this.tree.parse<NodeType>({
            id: TreeType.root,
            name: "",
            toolTip: "",
            treeType: TreeType.root,
            warninglevel: TreeWarningLevel.none, 
            row: 0,
            dataID: 0,
            children: [
            {
                id: 0,
                name: "Subject",
                toolTip: "",
                treeType: TreeType.subjectRoot, 
                warninglevel: TreeWarningLevel.none,
                row: 0,
                dataID: 0,
                children: [],
            },
            {
                id: TreeType.fileRoot,
                name: "File",
                toolTip: "",
                treeType: TreeType.fileRoot,
                warninglevel: TreeWarningLevel.none,
                row: 0,
                dataID: 0,
                children: [],
            },
            {
                id: TreeType.tagRoot,
                name: "Tag",
                toolTip: "",
                treeType: TreeType.tagRoot,
                warninglevel: TreeWarningLevel.none,
                row: 0,
                dataID: 0,
                children: [],
            },
            ],
        });

        this.root = root;
    }

    
    private getNodeTreeType(node: Node<NodeType> | undefined, treeType: TreeType) : Node<NodeType> | undefined {

        if(( !this.tree ) || (( !this.root ))){
            return;
        }

        if( !node ) {
            node = this.root;
            if( !node ) {
                return undefined;
            }
        }

        for (let index = 0; index < node.children.length; index++) {
            const element = node.children[index];

            if( treeType === element.model.treeType) {
                return element;
            }
        }

        return undefined;
    }

    private getNode(node: Node<NodeType> | undefined, id: number) : Node<NodeType> | undefined {

        if(( !this.tree ) || (( !this.root ))){
            return;
        }

        if( !node ) {
            node = this.root;
            if( !node ) {
                return undefined;
            }
        }

        for (let index = 0; index < node.children.length; index++) {
            const element = node.children[index];

            if( id === element.model.id) {
                return element;
            }
        }

        return undefined;
    }


    public addTag(folderName: string, requstData: RequstData){
        if(( !this.tree ) || (( !this.root ))){
            return;
        }

        let node = this.getNodeTreeType(undefined, TreeType.tagRoot);
        if( !node ) {
            return;
        }

        let isHit = false;
        for (let index = 0; index < node.children.length; index++) {
            const element = node.children[index];

            if( folderName === element.model.name) {
                node = element;
                isHit = true;
                break;
            }
        }
        if( !isHit ) {
            let requstDataParmet = {name: folderName, row: requstData.row, dataID: 0, toolTip: "", warninglevel: TreeWarningLevel.none};
            node = this.addChild( node, requstDataParmet, TreeType.node );
            if( node === undefined ) {
                return;
            }
        }

        this.addChild( node, requstData, TreeType.data );
    }

    public addSubject(folderName: string, requstData: RequstData){

        if(( !this.tree ) || (( !this.root ))){
            return;
        }

        let node = this.getNodeTreeType(undefined, TreeType.subjectRoot);
        if( !node ) {
            return;
        }

        let isHit = false;
        for (let index = 0; index < node.children.length; index++) {
            const element = node.children[index];

            if( folderName === element.model.name) {
                node = element;
                isHit = true;
                break;
            }
        }
        if( !isHit ) {
            let requstDataParmet = {name: folderName, row: requstData.row, dataID: 0, toolTip: "", warninglevel: TreeWarningLevel.none};
            node = this.addChild( node, requstDataParmet, TreeType.node );
            if( node === undefined ) {
                return;
            }
        }

        this.addChild( node, requstData, TreeType.data );
   }

    public addFile(filePath: string, requstData: RequstData){

        if(( !this.tree ) || (( !this.root ))){
            return;
        }

        // パス区切り文字で分割
        let pathArray : string[] = [];
        if (filePath.startsWith("\\\\")) {
            pathArray = filePath.substring(2).split(/[/\\]/);
            pathArray[0] = "\\\\" + pathArray[0];
        }
        else  if (filePath.startsWith("\\")) {
            pathArray = filePath.substring(1).split(/[/\\]/);
            pathArray[0] = "\\" + pathArray[0];
        }
        else {
            pathArray = filePath.split(/[/\\]/);
        }
        if( pathArray.length === 0 ) {
            return;
        }

        let pathCnt = 0;
        if( pathArray[0].length === 0 ) {
            pathCnt = 1;
        }

        let node = this.getNodeTreeType( undefined, TreeType.fileRoot);
        if( !node ) {
            return;
        }

        this.addFileRecursion( 0, node, filePath, pathArray, pathCnt, requstData);
    }


    private addFileRecursion(num : number, node : Node<NodeType>, filePath: string, pathArray: string[], pathCnt: number, requstData: RequstData){

        if(( !this.tree ) || (( !this.root ))){
            return;
        }

        // 子がいない時は、フォルダ名を枝にして追加していく
        if( node.children.length === 0 ) {
           for (let index2 = pathCnt; index2 < pathArray.length; index2++) {
                const element = pathArray[index2];

                let treeType: TreeType = TreeType.dir;
                if( index2 === pathArray.length - 1 ) {
                    treeType = TreeType.node;
                }

                let requstDataParmet = {name: element, row: requstData.row, dataID: 0, toolTip: "", warninglevel: TreeWarningLevel.none};
                let nodeTmp = this.addChild( node, requstDataParmet, treeType, false );
                if( nodeTmp === undefined ) {
                    return;
                }
                node = nodeTmp;
            }

            // エラー名を追加
            this.addChild( node, requstData, TreeType.data, true );
        }
        // 子があるときは、重複しないかを確認する
        else {
            for (let index = 0; index < node.children.length; index++) {
                const element = node.children[index];

                if(element.model.name === pathArray[pathCnt] ) {
                    // 一致なら次の文字へ
                    pathCnt++;
                    this.addFileRecursion(num + 1, element, filePath, pathArray, pathCnt, requstData);
                    return;
                }
            }

            // 不一致ならNodeを追加
            for (let index2 = pathCnt; index2 < pathArray.length; index2++) {
                const element = pathArray[index2];

                let treeType : number = TreeType.dir;
                if( index2 === pathArray.length - 1 ) {
                    treeType = TreeType.node;
                }

                let requstDataParmet = {name: element, row: requstData.row, dataID: 0, toolTip: "", warninglevel: TreeWarningLevel.none};
                let nodeTmp  = this.addChild( node, requstDataParmet, treeType, false );
                if( nodeTmp === undefined ) {
                    return;
                }

                node = nodeTmp;
            }

             // エラー名を追加
             this.addChild( node, requstData, TreeType.data, true );
        }

        return;
    }

    //
    private addChild(node : Node<NodeType>, requstData: RequstData, treeType: TreeType, isLine = false) : Node<NodeType> | undefined{

        if(( !this.tree ) || (( !this.root ))){
            return undefined;
        }

        let idTmp = this.count;
        this.count++;

        let nodeResult;

        let index = 0;
        for (index = 0; index < node.children.length; index++) {
            const element = node.children[index];

            if( isLine ) {
                if( element.model.row === requstData.row ) {
                    if( element.model.name > requstData.name ) {
                        break;
                    }
                }else {
                    if( element.model.row > requstData.row ) {
                        break;
                    }
                }
            }else {
                if( element.model.name === requstData.name ) {
                    if( element.model.row > requstData.row ) {
                        break;
                    }
                }else {
                    if( element.model.name > requstData.name ) {
                        break;
                    }
                }
            }
        }

        nodeResult = node.addChildAtIndex(this.tree.parse({ id: idTmp, name: requstData.name, row: requstData.row, dataID: requstData.dataID, toolTip: requstData.toolTip, treeType: treeType, warninglevel: requstData.warninglevel }), index);

        return nodeResult;
    }

    //
    public pruneFile(){

        if(( !this.tree ) || (( !this.root ))){
            return;
        }

        let node = this.getNode( undefined, TreeType.fileRoot);
        if( !node ) {
            return;
        }

        for (let index = 0; index < node.children.length; index++) {
            const element = node.children[index];

            this.pruneFileRecursion(0, element);
        }
    }


    private pruneFileRecursion(num : number, node : Node<NodeType>){

        if(( !this.tree ) || (( !this.root ))){
            return;
        }

        if( node.model.dataID !== TreeType.dir ) {
            return;
        }

        // 子が1つの時は、親に孫を移動させる
        if( node.children.length === 1 ) {
            if( node.children[0].model.dataID === TreeType.node ) {
                return;
            }

            // 子の名称を親に付け足す
            node.model.name = node.model.name + '\\' + node.children[0].model.name;

            // 孫のノードを親にぶら下げる
            for (let index = 0; index < node.children[0].children.length; index++) {
                const elementChildren = node.children[0].children[index];

                node.addChild(elementChildren);
            }

            // 不要な子を削除する
            node.children[0].drop();

            this.pruneFileRecursion(num + 1, node);
        }
        else {
            for (let index = 0; index < node.children.length; index++) {
                const element = node.children[index];

                this.pruneFileRecursion(num + 1, element);
            }
        }

        return;
    }


    public getTreeNode(id: number): { name: string, dataID: number, toolTip: string, type: number } | undefined {

        if(( !this.tree ) || (( !this.root ))){
            return;
        }

        const idEq = (id: number) => (node: Node<NodeType>) => {
            return node.model.id === id;
        };

        let node = this.root.first(idEq(id));
        if(!node){
            return;
        }

        return { name: node.model.name, dataID: node.model.dataID, toolTip: node.model.toolTip, type: node.model.type };
    }

    public getChildrenTreeNodeList(treeType: number, id: number | undefined): { id: number, name: string, dataID: number, toolTip: string, treeType: number, warninglevel:number }[] | undefined {

        if(( !this.tree ) || (( !this.root ))){
            return;
        }

        let node;        
        if( id === undefined ) {
            const idEq = (treeType: number) => (node: Node<NodeType>) => {
                return (node.model.treeType === treeType );
            };

            node = this.root.first(idEq(treeType));
            if(!node){
                return;
            }            
        }else {
            const idTreeTypeEq = (treeType: number, id: number) => (node: Node<NodeType>) => {
                return (node.model.id === id ) && (node.model.treeType === treeType);
            };

            node = this.root.first(idTreeTypeEq(treeType, id));
            if(!node){
                return;
            }
        }

        let nodelist: { id: number, name: string; dataID: number, toolTip: string, treeType: number, warninglevel: number  }[] = [];

        for (let index = 0; index < node.children.length; index++) {
            const element = node.children[index];

            nodelist.push({id: element.model.id, name: element.model.name, dataID: element.model.dataID, toolTip: element.model.toolTip, treeType: element.model.treeType, warninglevel: element.model.warninglevel});
        }

        return nodelist;
    }


    public output() {

        if(( !this.tree ) || (( !this.root ))){
            return;
        }

        for (let index = 0; index < this.root.children.length; index++) {
            const element = this.root.children[index];

            console.log(element.model.id + " " + element.model.name + " " + element.model.dataID + " " + element.model.treeType);

            this.outputRecursion( 1, element );
        }
    }

    private outputRecursion(num : number, node : Node<NodeType>) {

        let tab : string = "";
        for (let index = 0; index < num; index++) {
            tab += "\t";
        }

        for (let index = 0; index < node.children.length; index++) {
            const element = node.children[index];

            console.log(tab + element.model.id + " " + element.model.name + " " + element.model.dataID + " " + element.model.treeType);

            this.outputRecursion( num + 1, element );
        }
    }
}