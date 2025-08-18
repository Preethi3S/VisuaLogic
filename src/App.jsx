import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Auth pages
import SignIn from "./auth/SignIn";
import SignUp from "./auth/SignUp";
import PrivateRoute from "./auth/PrivateRoute";

// Main scenes
import HomeScene from "./scenes/HomeScene";
import OSScene from "./scenes/OSScene"

// OS Subjects
import CPUScheduling from "./subjects/os/CPUScheduler";
import MemoryManagement from "./subjects/os/MemoryPaging";
import DiskScheduling from "./subjects/os/DiskScheduling";
import DeadlockDetection from "./subjects/os/DeadlockDetection";
import MemoryAllocation from "./subjects/os/MemoryAllocation";
import ProcessSynchronization from "./subjects/os/ProcessSynchronization";
import VirtualMemory from "./subjects/os/VirtualMemory";
import ThreadScheduling from "./subjects/os/ThreadScheduling";
import FileSystemManagement from "./subjects/os/FileSystemManagement";
import OSIModel from "./subjects/networks/OSIModel";
import PacketFlow from "./subjects/networks/PacketFlow";
import SubnettingCalculator from "./subjects/networks/SubnettingCalculator";
import TCPHandshake from "./subjects/networks/TCPHandshake";
import SortingVisualizer from "./subjects/dsa/SortingVisualizer";
import SearchVisualizer from "./subjects/dsa/SearchVisualizer";

import ERDiagram from "./subjects/dbms/ERModelGenerator";

import TreeTraversalVisualizer from "./subjects/dsa/tree/TreeVisualizer";
import SegmentTreeVisualizer from "./subjects/dsa/tree/SegmentTreeVisualizer";
import AVLTree from "./subjects/dsa/tree/AVLTree";
import RedBlackTreeVisualizer from "./subjects/dsa/tree/RedBlackTreeVisualizer";
import LinkedListVisualizer from "./subjects/dsa/LinkedList";
import CodeFlowVisualizer from "./subjects/dsa/CodeVisual";
import RelationalSchema from "./subjects/dbms/RelationalSchema";
import SQLQueryPractice from "./subjects/dbms/SQLQueryPractice";
import NormalizationVisualizer from "./subjects/dbms/NormalizationVisualizer";
import SQLFlowVisualizer from "./subjects/dbms/SQLFlow";
import TransactionSimulator from "./subjects/dbms/TransactionSimulator";
import IndexingVisualizer from "./subjects/dbms/IndexingAndOptimization";
import LexicalAnalyzer from "./subjects/compiler/LexicalAnalyzer";
import SyntaxAnalyzer from "./subjects/compiler/SyntaxAnalyser";
import SemanticAnalyzer from "./subjects/compiler/SemanticAnalyser";
import IntermediateCodeGenerator from "./subjects/compiler/IntermediateCode";
import AnimationInspector from "./subjects/web/FrontendPipeline";
import AnimationVisualizer from "./subjects/web/AnimationVisualizer";
import NNArchitectureVisualizer from "./subjects/ai/NnArchitectureVisualizer";
import BackpropVisualizer from "./subjects/ai/BackPropagation";
import StackQueueVisualizer from "./subjects/dsa/StackQueueVisualizer";
import RecursionBacktrackingVisualizer from "./subjects/dsa/RecursionAndBacktracking";
import NetworksScene from "./scenes/NetworksScene";
import DSAScene from "./scenes/DsaScene";
import DBMSScene from "./scenes/DBMSScene";
import CompilerScene from "./scenes/CompilerScene";
import WebDesignScene from "./scenes/WebDesignScene";
import AIScene from "./scenes/AIScene";
import ClusteringVisualizer from "./subjects/ai/ClusteringVisualizer"

import QuizHome from "./quiz/QuizHome";
import QuizScene from "./quiz/QuizScene";
import MyBatches from "./scenes/MyBatches";
import IOMgmtScene from "./subjects/os/IOManagement";
import SystemCallScene from "./subjects/os/SystemCalls";
import BootProcessScene from "./subjects/os/BootProcess"; 
import SecurityScene from "./subjects/os/SecurityProtection";
import InterruptScene from "./subjects/os/InterruptHandling";
import KernelScene from "./subjects/os/Kernel";
import HTMLVisualizer from "./subjects/web/HTMLVisualizer";
import CSSVisualizer from "./subjects/web/CSSVisualizer";
import JSFundamentals from "./subjects/web/JSFundamentals";
import WebsiteArchitecture from "./subjects/web/WebsiteArchitecture";
import GitBranchingVisualizer from "./subjects/web/GitBranchingVisualizer";
import DeploymentWorkflow from "./subjects/web/CICDPipeline";
import DataTransmissionScene from "./subjects/networks/DataTransmissionScene";
import NetworkTopologiesVisualizer from "./subjects/networks/NetworkTopologies";
import RoutingScene from "./subjects/networks/Routing";
import SecurityAndPrivacyScene from "./subjects/networks/SecurityAndPrivacyScene";
import GraphBasics from "./subjects/dsa/graph/GraphBasics";
import GraphTraversal from "./subjects/dsa/graph/GraphTraversal";
import DijkstraVisualizer from "./subjects/dsa/graph/ShortestPath";
import NetworkFlow from "./subjects/dsa/graph/NetworkFlow";
import TopologicalSort from "./subjects/dsa/graph/Topologialsort";
import MSTVisualizer from "./subjects/dsa/graph/SpanningTree";
import GraphAdvanced from "./subjects/dsa/graph/GraphColorMapConnect";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          <Route path="/quiz" element={<QuizHome />} />
          <Route path="/quiz/:topic" element={<QuizScene />} />
          <Route path="/quiz/weekly/:topic" element={<QuizScene isWeeklyContest={true} />} />
          <Route path="/batches" element={<MyBatches />} />

          {/* Private Routes */}
          <Route
            path="*"
            element={
                <HomeScene />
            }
          />
          <Route
            path="/os"
            element={
              <OSScene />
            }
          />
          <Route
            path="/cn"
            element={
              <NetworksScene />
            }
          />
          <Route
            path="/dsa"
            element={
              <DSAScene />
            }
          />
          <Route
            path="/dbms"
            element={
              <DBMSScene/>
            }
          />
          <Route
            path="/cd"
            element={
              <CompilerScene/>
            }
          />
          <Route
            path="/web"
            element={
              <WebDesignScene/>
            }
          />
          <Route
            path="/ai"
            element={
              <AIScene/>
            }
          />
          <Route
            path="/os/cpuscheduling"
            element={
              <CPUScheduling />
            }
          />
          <Route
            path="/os/memorymanagement"
            element={
              
                <MemoryManagement />
              
            }
          />
          <Route
            path="/os/diskscheduling"
            element={
              
                <DiskScheduling />
              
            }
          />
          <Route
            path="/os/deadlockdetection"
            element={
              
                <DeadlockDetection />
              
            }
          />
          <Route
            path="/os/memoryallocation"
            element={
              <MemoryAllocation />
            }
          />
          <Route
            path="/os/iomanagement"
            element={
              <IOMgmtScene />
            }
          />

          <Route
            path="/os/processsynchronization"
            element={
              <ProcessSynchronization />
            }
          />

          <Route
            path="/os/virtualmemory"
            element={
              <VirtualMemory />
            }
          />
          <Route
            path="/os/threadscheduling"
            element={
              <ThreadScheduling />
            }
          />
          <Route
            path="/os/filesystemmanagement"
            element={
              <FileSystemManagement />
            }
          />
          <Route
            path="/os/systemcalls"
            element={
              <SystemCallScene />
            }
          />
          <Route
            path="/os/bootprocess"
            element={
              <BootProcessScene />
            }
          />
          <Route
            path="/os/security"
            element={
              <SecurityScene />
            }
          />
          <Route
            path="/os/interrupthandling"
            element={
              <InterruptScene />
            }
          />
          <Route
            path="/os/kernelarchitecture"
            element={
              <KernelScene />
            }
          />
          <Route
            path="/cn/osimodel"
            element={
              <OSIModel />
            }
          />
          <Route
            path="/cn/networktopology"
            element={
              <NetworkTopologiesVisualizer />
            }
          />
          <Route
            path="/cn/security"
            element={
              <SecurityAndPrivacyScene />
            }
          />
          <Route
            path="/cn/packetflow"
            element={
              <PacketFlow />
            }
          />
          <Route
            path="/cn/routing"
            element={
              <RoutingScene />
            }
          />
          <Route
            path="/cn/subnettingcalculator"
            element={
              <SubnettingCalculator />
            }
          />
          <Route
            path="/cn/tcphandshake"
            element={
              <TCPHandshake />
            }
          />
          <Route
            path="/cn/datatransmission"
            element={
              <DataTransmissionScene />
            }
          />
          <Route
            path="/dsa/sortingvisualizer"
            element={
              <SortingVisualizer />
            }
          />
          <Route
            path="/dsa/stackqueue"
            element={
              <StackQueueVisualizer />
            }
          />
          <Route
            path="/dsa/recbt"
            element={
              <RecursionBacktrackingVisualizer/>
            }
          />
          <Route
            path="/dsa/graph"
            element={
              <GraphBasics/>
            }
          />
          <Route
            path="/dsa/map"
            element={
              <GraphAdvanced/>
            }
          />
          <Route
            path="/dsa/graphtraversal"
            element={
              <GraphTraversal/>
            }
          />
          <Route
            path="/dsa/shortestpath"
            element={
              <DijkstraVisualizer/>
            }
          />
          <Route
            path="/dsa/networkflow"
            element={
              <NetworkFlow/>
            }
          />
          <Route
            path="/dsa/topology"
            element={
              <TopologicalSort/>
            }
          />
          <Route
            path="/dsa/spanningtree"
            element={
              <MSTVisualizer/>
            }
          />

          <Route
            path="/dsa/searchvisualizer"
            element={
              <SearchVisualizer />
            }
          />

          <Route
            path="/dsa/treevisualizer"
            element={
              <TreeTraversalVisualizer />
            }
          />
          <Route
            path="/dsa/segmenttreevisualizer"
            element={
              <SegmentTreeVisualizer />
            }
          />
          <Route
            path="/dsa/avltreevisualizer"
            element={
              <AVLTree />
            }
          />
          <Route
            path="/dsa/redblacktreevisualizer"
            element={
              <RedBlackTreeVisualizer />
            }
          />
          <Route
            path="/dsa/linkedlist"
            element={
              <LinkedListVisualizer />
            }
          />
          <Route
            path="/dsa/code"
            element={
              <CodeFlowVisualizer/>
            }
          />
          <Route
            path="/dbms/erdiagram"
            element={
              <ERDiagram />
            }
          />
          <Route
            path="/dbms/relationalschema"
            element={
              <RelationalSchema />
            }
          />
          <Route
            path="/dbms/sqlpractice"
            element={
              <SQLQueryPractice />
            }
          />
          <Route
            path="/dbms/normalizer"
            element={
              <NormalizationVisualizer />
            }
          />
          <Route
            path="/dbms/sqlflow"
            element={
              <SQLFlowVisualizer />
            }
          />
          <Route
            path="/dbms/transaction"
            element={
              <TransactionSimulator />
            }
          />
          <Route
            path="/dbms/indexing"
            element={
              <IndexingVisualizer />
            }
          />
          <Route
            path="/cd/lexicalanalysis"
            element={
              <LexicalAnalyzer />
            }
          />
          <Route
            path="/cd/syntaxanalysis"
            element={
              <SyntaxAnalyzer />
            }
          />
          <Route
            path="/cd/semanticanalysis"
            element={
              <SemanticAnalyzer />
            }
          />
          <Route
            path="/cd/icg"
            element={
              <IntermediateCodeGenerator />
            }
          />
          <Route
            path="/web/frontend"
            element={
              <AnimationInspector />
            }
          />
          <Route
            path="/web/animate"
            element={
              <AnimationVisualizer />
            }
          />
          <Route
            path="/web/html"
            element={
              <HTMLVisualizer />
            }
          />
          <Route
            path="/web/css"
            element={
              <CSSVisualizer />
            }
          />
          <Route
            path="/web/js"
            element={
              <JSFundamentals />
            }
          />
          <Route
            path="/web/architecture"
            element={
              <WebsiteArchitecture />
            }
          />
          <Route
            path="/web/git"
            element={
              <GitBranchingVisualizer />
            }
          />
          <Route
            path="/web/cicd"
            element={
              <DeploymentWorkflow />
            }
          />
          <Route
            path="/ai/neuralnetworks"
            element={
              <NNArchitectureVisualizer />
            }
          />
          <Route
            path="/ai/backpropagation"
            element={
              <BackpropVisualizer />
            }
          />
          <Route path="/ai/clustering" element={<ClusteringVisualizer />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
