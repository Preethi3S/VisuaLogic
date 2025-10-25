import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Auth pages
import SignIn from "./auth/SignIn";
import SignUp from "./auth/SignUp";
import PrivateRoute from "./auth/PrivateRoute";

// Main scenes
import HomeScene from "./scenes/HomeScene";
import OSScene from "./scenes/OSScene";

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

// Network Subjects
import OSIModel from "./subjects/networks/OSIModel";
import PacketFlow from "./subjects/networks/PacketFlow";
import SubnettingCalculator from "./subjects/networks/SubnettingCalculator";
import TCPHandshake from "./subjects/networks/TCPHandshake";
import DataTransmissionScene from "./subjects/networks/DataTransmissionScene";
import NetworkTopologiesVisualizer from "./subjects/networks/NetworkTopologies";
import RoutingScene from "./subjects/networks/Routing";
import SecurityAndPrivacyScene from "./subjects/networks/SecurityAndPrivacyScene";

// DSA Subjects
import SortingVisualizer from "./subjects/dsa/SortingVisualizer";
import SearchVisualizer from "./subjects/dsa/SearchVisualizer";
import TreeTraversalVisualizer from "./subjects/dsa/tree/TreeVisualizer";
import SegmentTreeVisualizer from "./subjects/dsa/tree/SegmentTreeVisualizer";
import AVLTree from "./subjects/dsa/tree/AVLTree";
import RedBlackTreeVisualizer from "./subjects/dsa/tree/RedBlackTreeVisualizer";
import LinkedListVisualizer from "./subjects/dsa/LinkedList";
import StackQueueVisualizer from "./subjects/dsa/StackQueueVisualizer";
import RecursionBacktrackingVisualizer from "./subjects/dsa/RecursionAndBacktracking";
import GraphBasics from "./subjects/dsa/graph/GraphBasics";
import GraphTraversal from "./subjects/dsa/graph/GraphTraversal";
import DijkstraVisualizer from "./subjects/dsa/graph/ShortestPath";
import NetworkFlow from "./subjects/dsa/graph/NetworkFlow";
import TopologicalSort from "./subjects/dsa/graph/Topologialsort";
import MSTVisualizer from "./subjects/dsa/graph/SpanningTree";
import GraphAdvanced from "./subjects/dsa/graph/GraphColorMapConnect";
import CodeFlowVisualizer from "./subjects/dsa/CodeVisual";

// DBMS Subjects
import ERDiagram from "./subjects/dbms/ERModelGenerator";
import RelationalSchema from "./subjects/dbms/RelationalSchema";
import SQLQueryPractice from "./subjects/dbms/SQLQueryPractice";
import NormalizationVisualizer from "./subjects/dbms/NormalizationVisualizer";
import SQLFlowVisualizer from "./subjects/dbms/SQLFlow";
import TransactionSimulator from "./subjects/dbms/TransactionSimulator";
import IndexingVisualizer from "./subjects/dbms/IndexingAndOptimization";

// Compiler Subjects
import LexicalAnalyzer from "./subjects/compiler/LexicalAnalyzer";
import SyntaxAnalyzer from "./subjects/compiler/SyntaxAnalyser";
import SemanticAnalyzer from "./subjects/compiler/SemanticAnalyser";
import IntermediateCodeGenerator from "./subjects/compiler/IntermediateCode";

// Web Subjects
import AnimationInspector from "./subjects/web/FrontendPipeline";
import AnimationVisualizer from "./subjects/web/AnimationVisualizer";
import HTMLVisualizer from "./subjects/web/HTMLVisualizer";
import CSSVisualizer from "./subjects/web/CSSVisualizer";
import JSFundamentals from "./subjects/web/JSFundamentals";
import WebsiteArchitecture from "./subjects/web/WebsiteArchitecture";
import GitBranchingVisualizer from "./subjects/web/GitBranchingVisualizer";
import DeploymentWorkflow from "./subjects/web/CICDPipeline";

// AI Subjects
import NNArchitectureVisualizer from "./subjects/ai/NnArchitectureVisualizer";
import BackpropVisualizer from "./subjects/ai/BackPropagation";
import ClusteringVisualizer from "./subjects/ai/ClusteringVisualizer";

// Scenes
import NetworksScene from "./scenes/NetworksScene";
import DSAScene from "./scenes/DsaScene";
import DBMSScene from "./scenes/DBMSScene";
import CompilerScene from "./scenes/CompilerScene";
import WebDesignScene from "./scenes/WebDesignScene";
import AIScene from "./scenes/AIScene";

// Quiz
import QuizHome from "./quiz/QuizHome";
import QuizScene from "./quiz/QuizScene";
import MyBatches from "./scenes/MyBatches";

// Other OS subjects
import IOMgmtScene from "./subjects/os/IOManagement";
import SystemCallScene from "./subjects/os/SystemCalls";
import BootProcessScene from "./subjects/os/BootProcess";
import SecurityScene from "./subjects/os/SecurityProtection";
import InterruptScene from "./subjects/os/InterruptHandling";
import KernelScene from "./subjects/os/Kernel";

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
              <PrivateRoute>
                <HomeScene />
              </PrivateRoute>
            }
          />
          <Route
            path="/os"
            element={
              <PrivateRoute>
                <OSScene />
              </PrivateRoute>
            }
          />
          <Route
            path="/cn"
            element={
              <PrivateRoute>
                <NetworksScene />
              </PrivateRoute>
            }
          />
          <Route
            path="/dsa"
            element={
              <PrivateRoute>
                <DSAScene />
              </PrivateRoute>
            }
          />
          <Route
            path="/dbms"
            element={
              <PrivateRoute>
                <DBMSScene />
              </PrivateRoute>
            }
          />
          <Route
            path="/cd"
            element={
              <PrivateRoute>
                <CompilerScene />
              </PrivateRoute>
            }
          />
          <Route
            path="/web"
            element={
              <PrivateRoute>
                <WebDesignScene />
              </PrivateRoute>
            }
          />
          <Route
            path="/ai"
            element={
              <PrivateRoute>
                <AIScene />
              </PrivateRoute>
            }
          />

          {/* OS Subjects */}
          <Route
            path="/os/cpuscheduling"
            element={
              <PrivateRoute>
                <CPUScheduling />
              </PrivateRoute>
            }
          />
          <Route
            path="/os/memorymanagement"
            element={
              <PrivateRoute>
                <MemoryManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/os/diskscheduling"
            element={
              <PrivateRoute>
                <DiskScheduling />
              </PrivateRoute>
            }
          />
          <Route
            path="/os/deadlockdetection"
            element={
              <PrivateRoute>
                <DeadlockDetection />
              </PrivateRoute>
            }
          />
          <Route
            path="/os/memoryallocation"
            element={
              <PrivateRoute>
                <MemoryAllocation />
              </PrivateRoute>
            }
          />
          <Route
            path="/os/iomanagement"
            element={
              <PrivateRoute>
                <IOMgmtScene />
              </PrivateRoute>
            }
          />
          <Route
            path="/os/processsynchronization"
            element={
              <PrivateRoute>
                <ProcessSynchronization />
              </PrivateRoute>
            }
          />
          <Route
            path="/os/virtualmemory"
            element={
              <PrivateRoute>
                <VirtualMemory />
              </PrivateRoute>
            }
          />
          <Route
            path="/os/threadscheduling"
            element={
              <PrivateRoute>
                <ThreadScheduling />
              </PrivateRoute>
            }
          />
          <Route
            path="/os/filesystemmanagement"
            element={
              <PrivateRoute>
                <FileSystemManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/os/systemcalls"
            element={
              <PrivateRoute>
                <SystemCallScene />
              </PrivateRoute>
            }
          />
          <Route
            path="/os/bootprocess"
            element={
              <PrivateRoute>
                <BootProcessScene />
              </PrivateRoute>
            }
          />
          <Route
            path="/os/security"
            element={
              <PrivateRoute>
                <SecurityScene />
              </PrivateRoute>
            }
          />
          <Route
            path="/os/interrupthandling"
            element={
              <PrivateRoute>
                <InterruptScene />
              </PrivateRoute>
            }
          />
          <Route
            path="/os/kernelarchitecture"
            element={
              <PrivateRoute>
                <KernelScene />
              </PrivateRoute>
            }
          />

          {/* Network Subjects */}
          <Route
            path="/cn/osimodel"
            element={
              <PrivateRoute>
                <OSIModel />
              </PrivateRoute>
            }
          />
          <Route
            path="/cn/networktopology"
            element={
              <PrivateRoute>
                <NetworkTopologiesVisualizer />
              </PrivateRoute>
            }
          />
          <Route
            path="/cn/security"
            element={
              <PrivateRoute>
                <SecurityAndPrivacyScene />
              </PrivateRoute>
            }
          />
          <Route
            path="/cn/packetflow"
            element={
              <PrivateRoute>
                <PacketFlow />
              </PrivateRoute>
            }
          />
          <Route
            path="/cn/routing"
            element={
              <PrivateRoute>
                <RoutingScene />
              </PrivateRoute>
            }
          />
          <Route
            path="/cn/subnettingcalculator"
            element={
              <PrivateRoute>
                <SubnettingCalculator />
              </PrivateRoute>
            }
          />
          <Route
            path="/cn/tcphandshake"
            element={
              <PrivateRoute>
                <TCPHandshake />
              </PrivateRoute>
            }
          />
          <Route
            path="/cn/datatransmission"
            element={
              <PrivateRoute>
                <DataTransmissionScene />
              </PrivateRoute>
            }
          />

          {/* DSA Subjects */}
          <Route
            path="/dsa/sortingvisualizer"
            element={
              <PrivateRoute>
                <SortingVisualizer />
              </PrivateRoute>
            }
          />
          <Route
            path="/dsa/stackqueue"
            element={
              <PrivateRoute>
                <StackQueueVisualizer />
              </PrivateRoute>
            }
          />
          <Route
            path="/dsa/recbt"
            element={
              <PrivateRoute>
                <RecursionBacktrackingVisualizer />
              </PrivateRoute>
            }
          />
          <Route
            path="/dsa/graph"
            element={
              <PrivateRoute>
                <GraphBasics />
              </PrivateRoute>
            }
          />
          <Route
            path="/dsa/map"
            element={
              <PrivateRoute>
                <GraphAdvanced />
              </PrivateRoute>
            }
          />
          <Route
            path="/dsa/graphtraversal"
            element={
              <PrivateRoute>
                <GraphTraversal />
              </PrivateRoute>
            }
          />
          <Route
            path="/dsa/shortestpath"
            element={
              <PrivateRoute>
                <DijkstraVisualizer />
              </PrivateRoute>
            }
          />
          <Route
            path="/dsa/networkflow"
            element={
              <PrivateRoute>
                <NetworkFlow />
              </PrivateRoute>
            }
          />
          <Route
            path="/dsa/topology"
            element={
              <PrivateRoute>
                <TopologicalSort />
              </PrivateRoute>
            }
          />
          <Route
            path="/dsa/spanningtree"
            element={
              <PrivateRoute>
                <MSTVisualizer />
              </PrivateRoute>
            }
          />
          <Route
            path="/dsa/searchvisualizer"
            element={
              <PrivateRoute>
                <SearchVisualizer />
              </PrivateRoute>
            }
          />
          <Route
            path="/dsa/treevisualizer"
            element={
              <PrivateRoute>
                <TreeTraversalVisualizer />
              </PrivateRoute>
            }
          />
          <Route
            path="/dsa/segmenttreevisualizer"
            element={
              <PrivateRoute>
                <SegmentTreeVisualizer />
              </PrivateRoute>
            }
          />
          <Route
            path="/dsa/avltreevisualizer"
            element={
              <PrivateRoute>
                <AVLTree />
              </PrivateRoute>
            }
          />
          <Route
            path="/dsa/redblacktreevisualizer"
            element={
              <PrivateRoute>
                <RedBlackTreeVisualizer />
              </PrivateRoute>
            }
          />
          <Route
            path="/dsa/linkedlist"
            element={
              <PrivateRoute>
                <LinkedListVisualizer />
              </PrivateRoute>
            }
          />
          <Route
            path="/dsa/code"
            element={
              <PrivateRoute>
                <CodeFlowVisualizer />
              </PrivateRoute>
            }
          />

          {/* DBMS Subjects */}
          <Route
            path="/dbms/erdiagram"
            element={
              <PrivateRoute>
                <ERDiagram />
              </PrivateRoute>
            }
          />
          <Route
            path="/dbms/relationalschema"
            element={
              <PrivateRoute>
                <RelationalSchema />
              </PrivateRoute>
            }
          />
          <Route
            path="/dbms/sqlpractice"
            element={
              <PrivateRoute>
                <SQLQueryPractice />
              </PrivateRoute>
            }
          />
          <Route
            path="/dbms/normalizer"
            element={
              <PrivateRoute>
                <NormalizationVisualizer />
              </PrivateRoute>
            }
          />
          <Route
            path="/dbms/sqlflow"
            element={
              <PrivateRoute>
                <SQLFlowVisualizer />
              </PrivateRoute>
            }
          />
          <Route
            path="/dbms/transaction"
            element={
              <PrivateRoute>
                <TransactionSimulator />
              </PrivateRoute>
            }
          />
          <Route
            path="/dbms/indexing"
            element={
              <PrivateRoute>
                <IndexingVisualizer />
              </PrivateRoute>
            }
          />

          {/* Compiler Subjects */}
          <Route
            path="/cd/lexicalanalysis"
            element={
              <PrivateRoute>
                <LexicalAnalyzer />
              </PrivateRoute>
            }
          />
          <Route
            path="/cd/syntaxanalysis"
            element={
              <PrivateRoute>
                <SyntaxAnalyzer />
              </PrivateRoute>
            }
          />
          <Route
            path="/cd/semanticanalysis"
            element={
              <PrivateRoute>
                <SemanticAnalyzer />
              </PrivateRoute>
            }
          />
          <Route
            path="/cd/icg"
            element={
              <PrivateRoute>
                <IntermediateCodeGenerator />
              </PrivateRoute>
            }
          />

          {/* Web Subjects */}
          <Route
            path="/web/frontend"
            element={
              <PrivateRoute>
                <AnimationInspector />
              </PrivateRoute>
            }
          />
          <Route
            path="/web/animate"
            element={
              <PrivateRoute>
                <AnimationVisualizer />
              </PrivateRoute>
            }
          />
          <Route
            path="/web/html"
            element={
              <PrivateRoute>
                <HTMLVisualizer />
              </PrivateRoute>
            }
          />
          <Route
            path="/web/css"
            element={
              <PrivateRoute>
                <CSSVisualizer />
              </PrivateRoute>
            }
          />
          <Route
            path="/web/js"
            element={
              <PrivateRoute>
                <JSFundamentals />
              </PrivateRoute>
            }
          />
          <Route
            path="/web/architecture"
            element={
              <PrivateRoute>
                <WebsiteArchitecture />
              </PrivateRoute>
            }
          />
          <Route
            path="/web/git"
            element={
              <PrivateRoute>
                <GitBranchingVisualizer />
              </PrivateRoute>
            }
          />
          <Route
            path="/web/cicd"
            element={
              <PrivateRoute>
                <DeploymentWorkflow />
              </PrivateRoute>
            }
          />

          {/* AI Subjects */}
          <Route
            path="/ai/neuralnetworks"
            element={
              <PrivateRoute>
                <NNArchitectureVisualizer />
              </PrivateRoute>
            }
          />
          <Route
            path="/ai/backpropagation"
            element={
              <PrivateRoute>
                <BackpropVisualizer />
              </PrivateRoute>
            }
          />
          <Route
            path="/ai/clustering"
            element={
              <PrivateRoute>
                <ClusteringVisualizer />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
